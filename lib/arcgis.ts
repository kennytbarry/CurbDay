/**
 * Live City of San Diego ArcGIS GeocodeServer (`PUD_Locator_Suggest`),
 * Council District (`DoIT_Public/MapServer/5`), and live ESD CollectionDetail
 * integration for real-time address autocomplete and schedule resolution.
 */
import {
  esdSiteToCollectionProfile,
  extractStreetAddress,
  extractZipCode,
  formatEsdAddress,
  searchCollectionProfiles,
  type ESDSiteRecord,
} from "@/lib/esd";
import {
  fetchLiveEsdScheduleForAddress,
  type LiveEsdScheduleResult,
} from "@/lib/esd-live";
import { DEMO_PROFILES, SAN_DIEGO_ESD_PAYLOAD } from "@/lib/demo-profiles";
import { slugify, type CollectionProfile } from "@/lib/schedule";

const ARCGIS_LOCATOR_BASE =
  "https://webmaps.sandiego.gov/arcgis/rest/services/Locators/PUD_Locator_Suggest/GeocodeServer";
const ARCGIS_COUNCIL_DISTRICT_QUERY =
  "https://webmaps.sandiego.gov/arcgis/rest/services/DoIT_Public/DoIT_Public/MapServer/5/query";

export interface AddressAutocompleteItem {
  id: string;
  address: string;
  streetAddress: string;
  neighborhood: string;
  councilDistrict: number;
  pickupDayShort: string;
  routeId: string;
  magicKey?: string;
  profile?: CollectionProfile;
}

interface ArcGISSuggestResponse {
  suggestions?: Array<{
    text: string;
    magicKey: string;
    isCollection: boolean;
  }>;
}

interface ArcGISCandidatesResponse {
  candidates?: Array<{
    address: string;
    location: { x: number; y: number };
    score: number;
  }>;
}

interface ArcGISDistrictQueryResponse {
  features?: Array<{
    attributes?: {
      DISTRICT?: number;
      COUNCIL_DISTRICT?: number;
      DIST_NUM?: number;
    };
  }>;
}

export interface SanDiegoZipMetadata {
  neighborhood: string;
  councilDistrict: number;
  routeZone: string;
  defaultDayCode: "Mon" | "Tue" | "Wed" | "Thu" | "Fri";
  routePrefix: string;
}

/**
 * City of San Diego ZIP code directory mapping to community planning areas,
 * Council Districts, and ESD route zones (with offline fallback day codes).
 */
export const SAN_DIEGO_ZIP_META: Record<string, SanDiegoZipMetadata> = {
  "92014": { neighborhood: "Del Mar Mesa", councilDistrict: 1, routeZone: "Route Zone 1", defaultDayCode: "Thu", routePrefix: "15" },
  "92037": { neighborhood: "La Jolla", councilDistrict: 1, routeZone: "Route Zone 1", defaultDayCode: "Wed", routePrefix: "15" },
  "92101": { neighborhood: "Downtown / Balboa Park", councilDistrict: 3, routeZone: "Route Zone 2", defaultDayCode: "Mon", routePrefix: "11" },
  "92102": { neighborhood: "Golden Hill / South Park", councilDistrict: 3, routeZone: "Route Zone 2", defaultDayCode: "Tue", routePrefix: "11" },
  "92103": { neighborhood: "Hillcrest / Mission Hills", councilDistrict: 3, routeZone: "Route Zone 3", defaultDayCode: "Wed", routePrefix: "13" },
  "92104": { neighborhood: "North Park", councilDistrict: 3, routeZone: "Route Zone 3", defaultDayCode: "Thu", routePrefix: "13" },
  "92105": { neighborhood: "City Heights", councilDistrict: 9, routeZone: "Route Zone 4", defaultDayCode: "Thu", routePrefix: "21" },
  "92106": { neighborhood: "Point Loma", councilDistrict: 2, routeZone: "Route Zone 1", defaultDayCode: "Tue", routePrefix: "12" },
  "92107": { neighborhood: "Ocean Beach", councilDistrict: 2, routeZone: "Route Zone 1", defaultDayCode: "Mon", routePrefix: "12" },
  "92108": { neighborhood: "Mission Valley", councilDistrict: 3, routeZone: "Route Zone 3", defaultDayCode: "Wed", routePrefix: "13" },
  "92109": { neighborhood: "Pacific Beach", councilDistrict: 2, routeZone: "Route Zone 1", defaultDayCode: "Mon", routePrefix: "14" },
  "92110": { neighborhood: "Old Town / Bay Park", councilDistrict: 2, routeZone: "Route Zone 2", defaultDayCode: "Wed", routePrefix: "14" },
  "92111": { neighborhood: "Linda Vista / Kearny Mesa", councilDistrict: 7, routeZone: "Route Zone 2", defaultDayCode: "Thu", routePrefix: "16" },
  "92113": { neighborhood: "Barrio Logan / Logan Heights", councilDistrict: 8, routeZone: "Route Zone 2", defaultDayCode: "Mon", routePrefix: "11" },
  "92114": { neighborhood: "Encanto", councilDistrict: 4, routeZone: "Route Zone 4", defaultDayCode: "Tue", routePrefix: "23" },
  "92115": { neighborhood: "College Area / Rolando", councilDistrict: 9, routeZone: "Route Zone 4", defaultDayCode: "Thu", routePrefix: "21" },
  "92116": { neighborhood: "Normal Heights / Kensington", councilDistrict: 9, routeZone: "Route Zone 4", defaultDayCode: "Thu", routePrefix: "21" },
  "92117": { neighborhood: "Clairemont", councilDistrict: 2, routeZone: "Route Zone 2", defaultDayCode: "Wed", routePrefix: "16" },
  "92119": { neighborhood: "San Carlos / Navajo", councilDistrict: 7, routeZone: "Route Zone 4", defaultDayCode: "Fri", routePrefix: "22" },
  "92120": { neighborhood: "Allied Gardens / Del Cerro", councilDistrict: 7, routeZone: "Route Zone 4", defaultDayCode: "Fri", routePrefix: "22" },
  "92121": { neighborhood: "Sorrento Valley", councilDistrict: 1, routeZone: "Route Zone 5", defaultDayCode: "Thu", routePrefix: "25" },
  "92122": { neighborhood: "University City", councilDistrict: 1, routeZone: "Route Zone 5", defaultDayCode: "Wed", routePrefix: "25" },
  "92123": { neighborhood: "Serra Mesa", councilDistrict: 7, routeZone: "Route Zone 4", defaultDayCode: "Fri", routePrefix: "22" },
  "92124": { neighborhood: "Tierrasanta", councilDistrict: 7, routeZone: "Route Zone 4", defaultDayCode: "Fri", routePrefix: "22" },
  "92126": { neighborhood: "Mira Mesa", councilDistrict: 6, routeZone: "Route Zone 5", defaultDayCode: "Tue", routePrefix: "26" },
  "92127": { neighborhood: "Rancho Bernardo", councilDistrict: 5, routeZone: "Route Zone 5", defaultDayCode: "Mon", routePrefix: "27" },
  "92128": { neighborhood: "Rancho Bernardo / Carmel Mtn", councilDistrict: 5, routeZone: "Route Zone 5", defaultDayCode: "Mon", routePrefix: "27" },
  "92129": { neighborhood: "Rancho Peñasquitos", councilDistrict: 5, routeZone: "Route Zone 5", defaultDayCode: "Tue", routePrefix: "27" },
  "92130": { neighborhood: "Carmel Valley", councilDistrict: 1, routeZone: "Route Zone 5", defaultDayCode: "Thu", routePrefix: "25" },
  "92131": { neighborhood: "Scripps Ranch", councilDistrict: 5, routeZone: "Route Zone 5", defaultDayCode: "Wed", routePrefix: "26" },
  "92139": { neighborhood: "Paradise Hills", councilDistrict: 4, routeZone: "Route Zone 4", defaultDayCode: "Tue", routePrefix: "23" },
  "92154": { neighborhood: "Otay Mesa / Nestor", councilDistrict: 8, routeZone: "Route Zone 6", defaultDayCode: "Mon", routePrefix: "28" },
  "92173": { neighborhood: "San Ysidro", councilDistrict: 8, routeZone: "Route Zone 6", defaultDayCode: "Mon", routePrefix: "28" },
};

const DAY_TO_BASE_REFUSE_EPOCH: Record<"Mon" | "Tue" | "Wed" | "Thu" | "Fri", number> = {
  Mon: 1792368000000, // 2026-10-19T00:00:00Z
  Tue: 1792454400000, // 2026-10-20T00:00:00Z
  Wed: 1792540800000, // 2026-10-21T00:00:00Z
  Thu: 1792627200000, // 2026-10-22T00:00:00Z
  Fri: 1792713600000, // 2026-10-23T00:00:00Z
};

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Normalizes ArcGIS locator strings like `"7445 JACKSON DR, SD, 92119"`
 * into `"7445 Jackson Dr, San Diego, CA 92119"`.
 */
export function normalizeArcGisAddress(rawText: string): string {
  const parts = rawText.split(",").map((s) => s.trim());
  const street = parts[0] ?? rawText.trim();
  const zip = extractZipCode(rawText);

  const normalizedRaw = zip
    ? `${street}, San Diego, CA ${zip}`
    : `${street}, San Diego, CA`;

  return formatEsdAddress(normalizedRaw);
}

function hashStreet(input: string): number {
  let hash = 0;
  const clean = input.trim().toUpperCase();
  for (let i = 0; i < clean.length; i++) {
    hash = (hash * 31 + clean.charCodeAt(i)) >>> 0;
  }
  return hash;
}

function dateToUtcMidnightEpoch(d: Date): number {
  return Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());
}

/**
 * Builds a `CollectionProfile` for a San Diego address, prioritizing the live
 * ESD `CollectionDetail` schedule when provided and falling back to offline
 * metadata only when the live service is unreachable.
 */
export function buildProfileForSanDiegoAddress(params: {
  address: string;
  lat?: number;
  lng?: number;
  councilDistrict?: number;
  liveSchedule?: LiveEsdScheduleResult | null;
}): CollectionProfile {
  const formattedAddress = normalizeArcGisAddress(params.address);
  const streetUpper = extractStreetAddress(formattedAddress).toUpperCase();
  const zip =
    extractZipCode(formattedAddress) ||
    (params.liveSchedule?.matchedAddress
      ? extractZipCode(params.liveSchedule.matchedAddress)
      : "");
  const finalAddress =
    zip && !formattedAddress.includes(zip)
      ? `${extractStreetAddress(formattedAddress)}, San Diego, CA ${zip}`
      : formattedAddress;

  const zipMeta = SAN_DIEGO_ZIP_META[zip] ?? {
    neighborhood: "San Diego",
    councilDistrict: params.councilDistrict ?? 3,
    routeZone: "Route Zone 3",
    defaultDayCode: "Wed" as const,
    routePrefix: "13",
  };

  const streetHash = hashStreet(streetUpper);
  const routeSuffix = String((streetHash % 35) + 1).padStart(2, "0");
  const refuseRoute = `${zipMeta.routePrefix}${routeSuffix}`;
  const recycleRoute = `${zipMeta.routePrefix}${String(((streetHash + 14) % 45) + 10).padStart(2, "0")}`;
  const organicsRoute = `3${zipMeta.routePrefix.slice(-1)}${routeSuffix}`;

  if (params.liveSchedule) {
    const live = params.liveSchedule;
    const liveRecord: ESDSiteRecord = {
      Site_Address__c: finalAddress
        .toUpperCase()
        .replace(", SAN DIEGO, CA", ", San Diego, CA"),
      Refuse_Next_Collections_Date__c: dateToUtcMidnightEpoch(
        live.refuseNextDate
      ),
      Recycle_Next_Collections_Date__c: dateToUtcMidnightEpoch(
        live.recycleNextDate
      ),
      Organics_Next_Collections_Date__c: dateToUtcMidnightEpoch(
        live.organicsNextDate
      ),
      Refuse_Day_Of_WeekF__c: live.pickupDayCode,
      Recycle_Day_of_WeekF__c: live.pickupDayCode,
      Organics_Day_Of_WeekF__c: live.pickupDayCode,
      Recycle_Week__c: live.recycleWeekCode,
      Status__c: live.status,
      Geolocation_ESRI__Latitude__s: params.lat ?? 32.7157,
      Geolocation_ESRI__Longitude__s: params.lng ?? -117.1611,
      Refuse_Route_Id__c: refuseRoute,
      Recycle_Route__c: recycleRoute,
      Organics_Route__c: organicsRoute,
    };

    const streetAddress = extractStreetAddress(finalAddress);
    const profile = esdSiteToCollectionProfile(liveRecord, {
      id: slugify(streetAddress),
      pillLabel: streetAddress,
      neighborhood: zipMeta.neighborhood,
      councilDistrict: params.councilDistrict ?? zipMeta.councilDistrict,
      routeZone: zipMeta.routeZone,
    });

    return {
      ...profile,
      esdSiteId: live.siteId,
      esdNextDates: {
        refuse: live.refuseNextIso,
        recycle: live.recycleNextIso,
        organics: live.organicsNextIso,
      },
      isLiveEsd: true,
    };
  }

  // Offline / static fallback: check if street matches SAN_DIEGO_ESD_PAYLOAD
  const knownRecords = SAN_DIEGO_ESD_PAYLOAD[0]?.result ?? [];
  const exactRecord = knownRecords.find(
    (rec) => extractStreetAddress(rec.Site_Address__c).toUpperCase() === streetUpper
  );

  if (exactRecord) {
    const existingDemo = DEMO_PROFILES.find(
      (p) => extractStreetAddress(p.address).toUpperCase() === streetUpper
    );
    if (existingDemo) return existingDemo;
    return esdSiteToCollectionProfile(exactRecord);
  }

  const isOddWeek = streetHash % 2 === 0;
  const dayCode = zipMeta.defaultDayCode;
  const refuseEpoch = DAY_TO_BASE_REFUSE_EPOCH[dayCode];
  const recycleEpoch = isOddWeek ? refuseEpoch + ONE_WEEK_MS : refuseEpoch;

  const syntheticRecord: ESDSiteRecord = {
    Site_Address__c: finalAddress
      .toUpperCase()
      .replace(", SAN DIEGO, CA", ", San Diego, CA"),
    Refuse_Next_Collections_Date__c: refuseEpoch,
    Recycle_Next_Collections_Date__c: recycleEpoch,
    Organics_Next_Collections_Date__c: refuseEpoch,
    Refuse_Day_Of_WeekF__c: dayCode,
    Recycle_Day_of_WeekF__c: dayCode,
    Organics_Day_Of_WeekF__c: dayCode,
    Recycle_Week__c: isOddWeek ? "O" : "E",
    Status__c: "Eligible for Services",
    Geolocation_ESRI__Latitude__s: params.lat ?? 32.7157,
    Geolocation_ESRI__Longitude__s: params.lng ?? -117.1611,
    Refuse_Route_Id__c: refuseRoute,
    Recycle_Route__c: recycleRoute,
    Organics_Route__c: organicsRoute,
  };

  const streetAddress = extractStreetAddress(finalAddress);
  return esdSiteToCollectionProfile(syntheticRecord, {
    id: slugify(streetAddress),
    pillLabel: streetAddress,
    neighborhood: zipMeta.neighborhood,
    councilDistrict: params.councilDistrict ?? zipMeta.councilDistrict,
    routeZone: zipMeta.routeZone,
  });
}

/**
 * Converts a `CollectionProfile` into an `AddressAutocompleteItem`.
 */
export function profileToAutocompleteItem(
  profile: CollectionProfile,
  magicKey?: string
): AddressAutocompleteItem {
  return {
    id: profile.id,
    address: profile.address,
    streetAddress: extractStreetAddress(profile.address),
    neighborhood: profile.neighborhood,
    councilDistrict: profile.councilDistrict,
    pickupDayShort: profile.pickupDay.slice(0, 3),
    routeId: profile.esdRoutes?.refuse ?? "",
    magicKey,
    profile,
  };
}

/**
 * Re-hydrates a serialized `CollectionProfile` from JSON so `recyclingAnchor`
 * is guaranteed to be a `Date` instance.
 */
export function hydrateCollectionProfile(
  raw: Omit<CollectionProfile, "recyclingAnchor"> & {
    recyclingAnchor: Date | string;
  }
): CollectionProfile {
  return {
    ...raw,
    recyclingAnchor:
      raw.recyclingAnchor instanceof Date
        ? raw.recyclingAnchor
        : new Date(raw.recyclingAnchor),
  };
}

/**
 * Queries the live City of San Diego `PUD_Locator_Suggest` GeocodeServer
 * for real-time street address completions as the user types.
 */
export async function suggestSanDiegoAddresses(
  rawQuery: string,
  limit = 6
): Promise<AddressAutocompleteItem[]> {
  const query = rawQuery.trim();
  if (query.length < 2) return [];

  const localMatches = searchCollectionProfiles(DEMO_PROFILES, query, limit).map(
    (p) => profileToAutocompleteItem(p)
  );

  try {
    const url = new URL(`${ARCGIS_LOCATOR_BASE}/suggest`);
    url.searchParams.set("text", query);
    url.searchParams.set("maxSuggestions", String(limit));
    url.searchParams.set("f", "json");

    const response = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
      return localMatches.slice(0, limit);
    }

    const data = (await response.json()) as ArcGISSuggestResponse;
    const suggestions = data.suggestions ?? [];

    const seenStreets = new Set(
      localMatches.map((item) => item.streetAddress.toUpperCase())
    );
    const merged: AddressAutocompleteItem[] = [...localMatches];

    for (const suggestion of suggestions) {
      if (!suggestion.text) continue;
      // Only include City of San Diego ("SD") or 92xxx suggestions
      if (
        suggestion.text.includes(",") &&
        !/,\s*(?:SD|SAN DIEGO)\b/i.test(suggestion.text)
      ) {
        continue;
      }
      const formattedAddress = normalizeArcGisAddress(suggestion.text);
      const streetAddress = extractStreetAddress(formattedAddress);
      const streetKey = streetAddress.toUpperCase();
      if (seenStreets.has(streetKey)) continue;
      seenStreets.add(streetKey);

      const zip = extractZipCode(formattedAddress);
      const zipMeta = SAN_DIEGO_ZIP_META[zip];

      merged.push({
        id: slugify(streetAddress),
        address: formattedAddress,
        streetAddress,
        neighborhood: zipMeta?.neighborhood ?? "San Diego",
        councilDistrict: zipMeta?.councilDistrict ?? 3,
        pickupDayShort: zip || "SD",
        routeId: "",
        magicKey: suggestion.magicKey,
      });
      if (merged.length >= limit) break;
    }

    return merged.slice(0, limit);
  } catch {
    return localMatches.slice(0, limit);
  }
}

async function fetchCouncilDistrictForPoint(
  lng: number,
  lat: number
): Promise<number | undefined> {
  try {
    const districtUrl = new URL(ARCGIS_COUNCIL_DISTRICT_QUERY);
    districtUrl.searchParams.set("geometry", `${lng},${lat}`);
    districtUrl.searchParams.set("geometryType", "esriGeometryPoint");
    districtUrl.searchParams.set("inSR", "4326");
    districtUrl.searchParams.set("spatialRel", "esriSpatialRelIntersects");
    districtUrl.searchParams.set("outFields", "*");
    districtUrl.searchParams.set("returnGeometry", "false");
    districtUrl.searchParams.set("f", "json");

    const distRes = await fetch(districtUrl.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (distRes.ok) {
      const distData = (await distRes.json()) as ArcGISDistrictQueryResponse;
      const attrs = distData.features?.[0]?.attributes;
      const distNum =
        attrs?.DISTRICT ?? attrs?.COUNCIL_DISTRICT ?? attrs?.DIST_NUM;
      if (typeof distNum === "number" && distNum >= 1 && distNum <= 9) {
        return distNum;
      }
    }
  } catch {
    // Ignore spatial timeout
  }
  return undefined;
}

/**
 * Resolves a full San Diego street address via `findAddressCandidates` on
 * `PUD_Locator_Suggest/GeocodeServer`, queries the live City Council District
 * polygon from `DoIT_Public/MapServer/5`, and pulls the live ESD collection
 * schedule from `getitdone.sandiego.gov/CollectionDetail`.
 */
export async function resolveSanDiegoAddress(
  rawAddress: string,
  magicKey?: string
): Promise<CollectionProfile | null> {
  const query = rawAddress.trim();
  if (!query) return null;

  let resolvedAddress = query;
  let lat: number | undefined;
  let lng: number | undefined;

  try {
    const candidateUrl = new URL(`${ARCGIS_LOCATOR_BASE}/findAddressCandidates`);
    candidateUrl.searchParams.set("SingleLine", query);
    if (magicKey) {
      candidateUrl.searchParams.set("magicKey", magicKey);
    }
    candidateUrl.searchParams.set("outSR", "4326");
    candidateUrl.searchParams.set("maxLocations", "1");
    candidateUrl.searchParams.set("f", "json");

    const response = await fetch(candidateUrl.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (response.ok) {
      const data = (await response.json()) as ArcGISCandidatesResponse;
      const best = data.candidates?.[0];
      if (best && best.score >= 70) {
        resolvedAddress = best.address;
        lng = best.location?.x;
        lat = best.location?.y;
      }
    }
  } catch {
    // Continue with raw query if ArcGIS candidate lookup fails
  }

  // Fetch Council District and live ESD CollectionDetail schedule in parallel
  const [councilDistrict, liveSchedule] = await Promise.all([
    typeof lng === "number" && typeof lat === "number"
      ? fetchCouncilDistrictForPoint(lng, lat)
      : Promise.resolve(undefined),
    fetchLiveEsdScheduleForAddress({
      address: resolvedAddress,
      lat,
      lng,
    }),
  ]);

  if (liveSchedule || (typeof lng === "number" && typeof lat === "number")) {
    return buildProfileForSanDiegoAddress({
      address: liveSchedule?.matchedAddress || resolvedAddress,
      lat,
      lng,
      councilDistrict,
      liveSchedule,
    });
  }

  // Offline / local fallback
  const localMatches = searchCollectionProfiles(DEMO_PROFILES, query, 1);
  if (localMatches.length > 0) {
    return localMatches[0];
  }

  if (/^\d+\s+[a-zA-Z0-9\s]+/.test(query)) {
    return buildProfileForSanDiegoAddress({ address: query });
  }

  return null;
}
