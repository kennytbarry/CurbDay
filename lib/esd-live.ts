/**
 * Live City of San Diego ESD Collection Schedule fetcher.
 *
 * Queries the City of San Diego's Get It Done / Environmental Services
 * lookup (`TSWNewReport?type=Missed%20Trash` -> `CollectionDetail?id={siteId}`)
 * combined with SanGIS / City of San Diego `DoIT_Public/MapServer/4` (Parcels)
 * to resolve real-time Trash, Recycling, and Organics collection schedules
 * for any San Diego street address.
 */
import { createLocalNoonDate, type WeekdayName } from "@/lib/holidays";

const GID_MISSED_TRASH_URL =
  "https://getitdone.sandiego.gov/TSWNewReport?type=Missed%20Trash";
const GID_COLLECTION_DETAIL_URL =
  "https://getitdone.sandiego.gov/CollectionDetail";
const ARCGIS_PARCELS_QUERY_URL =
  "https://webmaps.sandiego.gov/arcgis/rest/services/DoIT_Public/DoIT_Public/MapServer/4/query";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

const SESSION_TTL_MS = 8 * 60 * 1000; // 8 minutes

export interface LiveEsdScheduleResult {
  siteId: string;
  matchedAddress: string;
  status: string;
  familyType: string;
  pickupDay: WeekdayName;
  pickupDayCode: "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
  refuseNextDate: Date;
  recycleNextDate: Date;
  organicsNextDate: Date;
  refuseNextIso: string;
  recycleNextIso: string;
  organicsNextIso: string;
  recycleWeekCode: "O" | "E";
  calendarCode?: "cl1" | "cl2";
}

interface EsdVisualforceSession {
  baseFields: URLSearchParams;
  cookieHeader: string;
  streetNumId: string;
  streetNameId: string;
  streetSuffixId: string;
  searchActionId: string;
  fetchedAt: number;
}

interface EsdSiteCandidate {
  siteId: string;
  status: string;
  address: string;
  itemNo: string;
  familyType: string;
}

interface ArcGISParcelFeature {
  attributes?: {
    APN?: string;
    SITUS_ADDRESS?: number;
    SITUS_STREET?: string;
    SITUS_SUFFIX?: string;
    SITUS_ZIP?: string;
  };
}

let cachedSession: EsdVisualforceSession | null = null;
let sessionQueue: Promise<unknown> = Promise.resolve();

/** In-memory cache of resolved live schedules keyed by normalized street/block. */
const liveScheduleCache = new Map<string, LiveEsdScheduleResult>();

const STREET_SUFFIXES = new Set([
  "ST",
  "STREET",
  "AVE",
  "AV",
  "AVENUE",
  "DR",
  "DRIVE",
  "RD",
  "ROAD",
  "BLVD",
  "BOULEVARD",
  "LN",
  "LANE",
  "CT",
  "COURT",
  "PL",
  "PLACE",
  "WAY",
  "WY",
  "CIR",
  "CIRCLE",
  "TER",
  "TERRACE",
  "PKWY",
  "PARKWAY",
  "ROW",
  "WALK",
  "TRL",
  "TRAIL",
  "MALL",
  "HWY",
  "LOOP",
  "ALY",
  "CV",
  "PT",
]);

const DIRECTIONAL_PREFIXES = new Set([
  "N",
  "S",
  "E",
  "W",
  "NORTH",
  "SOUTH",
  "EAST",
  "WEST",
]);

const DAY_NAME_MAP: Record<
  string,
  { full: WeekdayName; code: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" }
> = {
  monday: { full: "Monday", code: "Mon" },
  mon: { full: "Monday", code: "Mon" },
  tuesday: { full: "Tuesday", code: "Tue" },
  tue: { full: "Tuesday", code: "Tue" },
  wednesday: { full: "Wednesday", code: "Wed" },
  wed: { full: "Wednesday", code: "Wed" },
  thursday: { full: "Thursday", code: "Thu" },
  thu: { full: "Thursday", code: "Thu" },
  friday: { full: "Friday", code: "Fri" },
  fri: { full: "Friday", code: "Fri" },
};

/**
 * Parses a street address like `"738 W Upas St, San Diego, CA 92103"` into
 * `{ streetNumber: "738", streetName: "Upas", rawStreetName: "W Upas", suffix: "St" }`.
 */
export function parseStreetForEsdLookup(rawAddress: string): {
  streetNumber: string;
  streetName: string;
  rawStreetName: string;
  suffix: string;
} | null {
  const beforeComma = (rawAddress.split(",")[0] ?? rawAddress)
    .replace(/\s+(?:#|APT|UNIT|STE|SUITE)\b.*$/i, "")
    .trim();

  const match = beforeComma.match(/^(\d+)\s+(.+)$/);
  if (!match) return null;

  const streetNumber = match[1];
  const tokens = match[2].trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;

  let suffix = "";
  if (
    tokens.length > 1 &&
    STREET_SUFFIXES.has(tokens[tokens.length - 1].toUpperCase().replace(/\./g, ""))
  ) {
    suffix = tokens.pop()!;
  }

  const rawStreetName = tokens.join(" ");

  if (
    tokens.length > 1 &&
    DIRECTIONAL_PREFIXES.has(tokens[0].toUpperCase().replace(/\./g, ""))
  ) {
    tokens.shift();
  }

  const streetName = tokens.join(" ");
  return {
    streetNumber,
    streetName: streetName || rawStreetName,
    rawStreetName,
    suffix,
  };
}

function extractHiddenInputs(srcHtml: string, target: URLSearchParams): void {
  const inputRegex = /<input\b([^>]+)>/gi;
  for (const match of srcHtml.matchAll(inputRegex)) {
    const attrs = match[1];
    const typeMatch = attrs.match(/\btype="([^"]+)"/i);
    const type = (typeMatch?.[1] ?? "text").toLowerCase();
    if (
      type === "submit" ||
      type === "button" ||
      type === "image" ||
      type === "file" ||
      type === "checkbox" ||
      type === "radio"
    ) {
      continue;
    }
    const nameMatch = attrs.match(/\bname="([^"]+)"/i);
    if (!nameMatch) continue;
    const name = nameMatch[1];
    if (name === "pgid:j_id0:j_id1:j_id3") continue;
    const valMatch = attrs.match(/\bvalue="([^"]*)"/i);
    target.set(name, valMatch ? valMatch[1] : "");
  }
}

async function createEsdSession(): Promise<EsdVisualforceSession> {
  const res = await fetch(GID_MISSED_TRASH_URL, {
    headers: { "User-Agent": USER_AGENT },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`ESD session init failed with HTTP ${res.status}`);
  }
  const html = await res.text();
  const cookies = res.headers.getSetCookie?.() ?? [];
  const cookieHeader = cookies.map((c) => c.split(";")[0]).join("; ");

  const baseFields = new URLSearchParams();
  baseFields.set("AJAXREQUEST", "_viewRoot");
  extractHiddenInputs(html, baseFields);

  const streetNumId =
    html.match(/id="(pgid:fmId:[^"]+:siteStreetNumberId)"/)?.[1] ??
    "pgid:fmId:j_id265:j_id266:siteStreetNumberId";
  const streetNameId =
    html.match(/id="(pgid:fmId:[^"]+:siteStreetNameId)"/)?.[1] ??
    "pgid:fmId:j_id265:j_id266:siteStreetNameId";
  const streetSuffixId =
    html.match(/id="(pgid:fmId:[^"]+:siteStreetSuffixId)"/)?.[1] ??
    "pgid:fmId:j_id265:j_id266:siteStreetSuffixId";
  const searchActionId =
    html.match(
      /siteSearchFn=function\(\)\{A4J\.AJAX\.Submit\('pgid:fmId',null,\{'similarityGroupingId':'(pgid:fmId:[^']+)'/
    )?.[1] ?? "pgid:fmId:j_id265:j_id266:j_id279";

  return {
    baseFields,
    cookieHeader,
    streetNumId,
    streetNameId,
    streetSuffixId,
    searchActionId,
    fetchedAt: Date.now(),
  };
}

async function runWithEsdSession<T>(
  fn: (session: EsdVisualforceSession) => Promise<T>
): Promise<T> {
  const next = sessionQueue.then(async () => {
    if (
      !cachedSession ||
      Date.now() - cachedSession.fetchedAt > SESSION_TTL_MS
    ) {
      cachedSession = await createEsdSession();
    }
    try {
      return await fn(cachedSession);
    } catch {
      cachedSession = await createEsdSession();
      return await fn(cachedSession);
    }
  });
  sessionQueue = next.then(
    () => undefined,
    () => undefined
  );
  return next;
}

/**
 * Searches `TSWNewReport?type=Missed%20Trash` for `(streetNumber, streetName)`
 * and returns matching `EsdSiteCandidate` records.
 */
async function searchEsdCandidatesByStreet(
  streetNumber: string,
  streetName: string
): Promise<EsdSiteCandidate[]> {
  return runWithEsdSession(async (session) => {
    const body = new URLSearchParams(session.baseFields);
    body.set("pgid:fmId", "pgid:fmId");
    body.set(session.streetNumId, streetNumber);
    body.set(session.streetNameId, streetName);
    body.set(session.streetSuffixId, "");
    body.set(session.searchActionId, session.searchActionId);

    const postRes = await fetch(GID_MISSED_TRASH_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": USER_AGENT,
        Referer: GID_MISSED_TRASH_URL,
        Origin: "https://getitdone.sandiego.gov",
        ...(session.cookieHeader ? { Cookie: session.cookieHeader } : {}),
      },
      body: body.toString(),
      cache: "no-store",
    });

    if (!postRes.ok) {
      throw new Error(`ESD site search failed with HTTP ${postRes.status}`);
    }

    const postHtml = await postRes.text();
    if (!postHtml.includes("com.salesforce.visualforce.ViewState")) {
      throw new Error("Missing Visualforce ViewState in response");
    }

    extractHiddenInputs(postHtml, session.baseFields);
    session.fetchedAt = Date.now();

    const candidates: EsdSiteCandidate[] = [];
    for (const match of postHtml.matchAll(/selectSiteFunc\(([^)]+)\)/g)) {
      const args = [...match[1].matchAll(/'([^']*)'/g)].map((m) => m[1]);
      if (args[0]) {
        candidates.push({
          siteId: args[0],
          status: args[1] ?? "Eligible for Services",
          address: args[2] ?? "",
          itemNo: args[3] ?? "1",
          familyType: args[4] ?? "",
        });
      }
    }

    return candidates;
  });
}

function parseSlashDateToLocalNoon(slashDate: string): Date | null {
  const match = slashDate.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const month = Number(match[1]) - 1;
  const day = Number(match[2]);
  const year = Number(match[3]);
  return createLocalNoonDate(year, month, day);
}

/**
 * Parses the HTML of `https://getitdone.sandiego.gov/CollectionDetail?id={siteId}`.
 */
export function parseCollectionDetailHtml(
  detailHtml: string,
  candidate: EsdSiteCandidate
): LiveEsdScheduleResult | null {
  const trashDayRaw = detailHtml.match(
    /id="trash-date"[\s\S]*?<p class="day">(?:<span[^>]*>)?\s*([A-Za-z]+)/i
  )?.[1];
  const trashDateRaw = detailHtml.match(
    /id="trash-date"[\s\S]*?<p class="date">(?:<span[^>]*>)?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i
  )?.[1];

  if (!trashDayRaw || !trashDateRaw) return null;

  const dayMeta = DAY_NAME_MAP[trashDayRaw.toLowerCase()];
  const refuseNextDate = parseSlashDateToLocalNoon(trashDateRaw);
  if (!dayMeta || !refuseNextDate) return null;

  const recycleDateRaw = detailHtml.match(
    /id="recycle-date"[\s\S]*?<p class="date">(?:<span[^>]*>)?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i
  )?.[1];
  const organicsDateRaw = detailHtml.match(
    /id="organics-date"[\s\S]*?<p class="date">(?:<span[^>]*>)?\s*(\d{1,2}\/\d{1,2}\/\d{4})/i
  )?.[1];

  const recycleNextDate =
    (recycleDateRaw ? parseSlashDateToLocalNoon(recycleDateRaw) : null) ??
    refuseNextDate;
  const organicsNextDate =
    (organicsDateRaw ? parseSlashDateToLocalNoon(organicsDateRaw) : null) ??
    refuseNextDate;

  const calPdfMatch = detailHtml.match(/curbsider-(cl[12])\.pdf/i)?.[1] as
    | "cl1"
    | "cl2"
    | undefined;
  const subheadingAddress = detailHtml
    .match(/<p class="subheading">\s*([^<]+?)\s*<\/p>/i)?.[1]
    ?.trim();

  const sameWeekRecycle =
    recycleNextDate.getTime() === refuseNextDate.getTime();
  const recycleWeekCode: "O" | "E" =
    calPdfMatch === "cl1"
      ? "O"
      : calPdfMatch === "cl2"
        ? "E"
        : sameWeekRecycle
          ? "O"
          : "E";

  return {
    siteId: candidate.siteId,
    matchedAddress: subheadingAddress || candidate.address,
    status: candidate.status || "Eligible for Services",
    familyType: candidate.familyType || "Single Family",
    pickupDay: dayMeta.full,
    pickupDayCode: dayMeta.code,
    refuseNextDate,
    recycleNextDate,
    organicsNextDate,
    refuseNextIso: refuseNextDate.toISOString(),
    recycleNextIso: recycleNextDate.toISOString(),
    organicsNextIso: organicsNextDate.toISOString(),
    recycleWeekCode,
    calendarCode: calPdfMatch,
  };
}

async function fetchDetailForCandidate(
  candidate: EsdSiteCandidate
): Promise<{
  schedule: LiveEsdScheduleResult | null;
  hasRecycleSchedule: boolean;
}> {
  const url = `${GID_COLLECTION_DETAIL_URL}?id=${encodeURIComponent(candidate.siteId)}`;
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    return { schedule: null, hasRecycleSchedule: false };
  }
  const html = await res.text();
  const hasRecycleSchedule =
    /id="recycle-date"[\s\S]*?<p class="date">(?:<span[^>]*>)?\s*\d{1,2}\/\d{1,2}\/\d{4}/i.test(
      html
    );
  const schedule = parseCollectionDetailHtml(html, candidate);
  return { schedule, hasRecycleSchedule };
}

/**
 * Queries `DoIT_Public/MapServer/4/query` for single-family residential parcels
 * on the same street (or within a spatial envelope around `lat, lng`) so commercial,
 * multi-family, or park addresses on a block still resolve the real street pickup schedule.
 */
async function findNearbyResidentialParcels(params: {
  streetNumber: number;
  streetName: string;
  lat?: number;
  lng?: number;
}): Promise<Array<{ streetNumber: string; streetName: string }>> {
  const cleanStreet = params.streetName
    .toUpperCase()
    .replace(/[^A-Z0-9\s]/g, "")
    .trim();
  const results: Array<{ streetNumber: string; streetName: string; dist: number }> =
    [];

  // 1. Same street in City of San Diego
  if (cleanStreet) {
    try {
      const url = new URL(ARCGIS_PARCELS_QUERY_URL);
      url.searchParams.set(
        "where",
        `SITUS_JURIS='SD' AND NUCLEUS_USE_CD='111' AND SITUS_STREET='${cleanStreet}' AND SITUS_ADDRESS IS NOT NULL`
      );
      url.searchParams.set("outFields", "SITUS_ADDRESS,SITUS_STREET");
      url.searchParams.set("returnGeometry", "false");
      url.searchParams.set("resultRecordCount", "30");
      url.searchParams.set("f", "json");

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 },
      });
      if (res.ok) {
        const data = (await res.json()) as { features?: ArcGISParcelFeature[] };
        for (const feat of data.features ?? []) {
          const num = feat.attributes?.SITUS_ADDRESS;
          const st = feat.attributes?.SITUS_STREET?.trim();
          if (typeof num === "number" && num > 0 && st) {
            results.push({
              streetNumber: String(num),
              streetName: st,
              dist: Math.abs(num - params.streetNumber),
            });
          }
        }
      }
    } catch {
      // Ignore spatial fallback error
    }
  }

  if (results.length > 0) {
    results.sort((a, b) => a.dist - b.dist);
    return results.slice(0, 3);
  }

  // 2. Spatial envelope fallback around (lng, lat) if the street has no single-family parcels
  if (typeof params.lat === "number" && typeof params.lng === "number") {
    try {
      const delta = 0.008;
      const url = new URL(ARCGIS_PARCELS_QUERY_URL);
      url.searchParams.set(
        "geometry",
        `${params.lng - delta},${params.lat - delta},${params.lng + delta},${params.lat + delta}`
      );
      url.searchParams.set("geometryType", "esriGeometryEnvelope");
      url.searchParams.set("inSR", "4326");
      url.searchParams.set("spatialRel", "esriSpatialRelIntersects");
      url.searchParams.set(
        "where",
        "SITUS_JURIS='SD' AND NUCLEUS_USE_CD='111' AND SITUS_ADDRESS IS NOT NULL"
      );
      url.searchParams.set("outFields", "SITUS_ADDRESS,SITUS_STREET");
      url.searchParams.set("returnGeometry", "false");
      url.searchParams.set("resultRecordCount", "10");
      url.searchParams.set("f", "json");

      const res = await fetch(url.toString(), {
        headers: { Accept: "application/json" },
        next: { revalidate: 86400 },
      });
      if (res.ok) {
        const data = (await res.json()) as { features?: ArcGISParcelFeature[] };
        for (const feat of data.features ?? []) {
          const num = feat.attributes?.SITUS_ADDRESS;
          const st = feat.attributes?.SITUS_STREET?.trim();
          if (typeof num === "number" && num > 0 && st) {
            results.push({
              streetNumber: String(num),
              streetName: st,
              dist: Math.abs(num - params.streetNumber),
            });
          }
        }
      }
    } catch {
      // Ignore spatial fallback error
    }
  }

  return results.slice(0, 3);
}

/**
 * Resolves the live City of San Diego ESD collection schedule for a street address.
 */
export async function fetchLiveEsdScheduleForAddress(params: {
  address: string;
  lat?: number;
  lng?: number;
}): Promise<LiveEsdScheduleResult | null> {
  const parsed = parseStreetForEsdLookup(params.address);
  if (!parsed) return null;

  const cacheKey = `${parsed.streetNumber}|${parsed.streetName.toUpperCase()}`;
  const cached = liveScheduleCache.get(cacheKey);
  if (cached) return cached;

  try {
    // 1. Try direct ESD site lookup for the exact house number + street name
    let candidates = await searchEsdCandidatesByStreet(
      parsed.streetNumber,
      parsed.streetName
    );
    if (
      candidates.length === 0 &&
      parsed.rawStreetName.toUpperCase() !== parsed.streetName.toUpperCase()
    ) {
      candidates = await searchEsdCandidatesByStreet(
        parsed.streetNumber,
        parsed.rawStreetName
      );
    }

    let partialSchedule: LiveEsdScheduleResult | null = null;

    if (candidates.length > 0) {
      // Prefer Single Family + Eligible for Services
      const sorted = [...candidates].sort((a, b) => {
        const aScore =
          (a.familyType.toLowerCase().includes("single") ? 2 : 0) +
          (a.status.toLowerCase().includes("eligible") ? 1 : 0);
        const bScore =
          (b.familyType.toLowerCase().includes("single") ? 2 : 0) +
          (b.status.toLowerCase().includes("eligible") ? 1 : 0);
        return bScore - aScore;
      });

      const { schedule, hasRecycleSchedule } = await fetchDetailForCandidate(
        sorted[0]
      );
      if (schedule && hasRecycleSchedule) {
        liveScheduleCache.set(cacheKey, schedule);
        return schedule;
      }
      partialSchedule = schedule;
    }

    // 2. If the exact address was a commercial/condo/park parcel or lacked recycling info,
    //    find the nearest single-family residential parcel on the same street or block.
    const nearbyParcels = await findNearbyResidentialParcels({
      streetNumber: Number(parsed.streetNumber) || 1000,
      streetName: parsed.streetName,
      lat: params.lat,
      lng: params.lng,
    });

    for (const neighbor of nearbyParcels) {
      const neighborKey = `${neighbor.streetNumber}|${neighbor.streetName.toUpperCase()}`;
      const cachedNeighbor = liveScheduleCache.get(neighborKey);
      if (cachedNeighbor) {
        liveScheduleCache.set(cacheKey, cachedNeighbor);
        return cachedNeighbor;
      }

      const neighborCandidates = await searchEsdCandidatesByStreet(
        neighbor.streetNumber,
        neighbor.streetName
      );
      if (neighborCandidates.length === 0) continue;

      const { schedule, hasRecycleSchedule } = await fetchDetailForCandidate(
        neighborCandidates[0]
      );
      if (schedule && hasRecycleSchedule) {
        liveScheduleCache.set(neighborKey, schedule);
        liveScheduleCache.set(cacheKey, schedule);
        return schedule;
      }
      if (schedule && !partialSchedule) {
        partialSchedule = schedule;
      }
    }

    if (partialSchedule) {
      liveScheduleCache.set(cacheKey, partialSchedule);
      return partialSchedule;
    }
  } catch {
    // Network / offline fallback handled by caller
  }

  return null;
}
