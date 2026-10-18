/**
 * Parser, converter, and search helpers for the City of San Diego ESD
 * Visualforce Remoting service (`CollectionMapLookupController.getSitesByAddress`).
 */
import {
  createLocalNoonDate,
  parseDayNameToIndex,
  type WeekdayName,
} from "@/lib/holidays";
import { slugify, type CollectionProfile } from "@/lib/schedule";

export interface ESDSiteRecord {
  Site_Address__c: string;
  Refuse_Next_Collections_Date__c: number;
  Recycle_Next_Collections_Date__c: number;
  Organics_Next_Collections_Date__c: number;
  Refuse_Day_Of_WeekF__c: string;
  /** Note lowercase "of" in the live City ESD schema. */
  Recycle_Day_of_WeekF__c: string;
  Organics_Day_Of_WeekF__c: string;
  /** "O" (Odd week) or "E" (Even week). */
  Recycle_Week__c: string;
  Status__c: string;
  Geolocation_ESRI__Latitude__s: number;
  Geolocation_ESRI__Longitude__s: number;
  Refuse_Route_Id__c: string;
  Recycle_Route__c: string;
  Organics_Route__c: string;
}

export interface ESDLookupActionEnvelope {
  statusCode: number;
  action: "CollectionMapLookupController" | string;
  method: "getSitesByAddress" | string;
  result: ESDSiteRecord[];
}

export type ESDLookupResponse = ESDLookupActionEnvelope[];

export interface ParsedESDSite {
  address: string;
  streetLabel: string;
  zipCode: string;
  pickupDay: WeekdayName;
  refuseNextDate: Date;
  recycleNextDate: Date;
  organicsNextDate: Date;
  recyclingAnchor: Date;
  recycleWeekCode: string;
  isEligible: boolean;
  status: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  routes: {
    refuse: string;
    recycle: string;
    organics: string;
  };
}

const INDEX_TO_WEEKDAY: Record<number, WeekdayName> = {
  1: "Monday",
  2: "Tuesday",
  3: "Wednesday",
  4: "Thursday",
  5: "Friday",
};

const ZIP_COMMUNITY_META: Record<
  string,
  { neighborhood: string; councilDistrict: number; routeZone: string }
> = {
  "92119": { neighborhood: "San Carlos", councilDistrict: 7, routeZone: "Route Zone 4" },
  "92101": { neighborhood: "Balboa Park", councilDistrict: 3, routeZone: "Route Zone 2" },
  "92104": { neighborhood: "North Park", councilDistrict: 3, routeZone: "Route Zone 3" },
  "92109": { neighborhood: "Pacific Beach", councilDistrict: 2, routeZone: "Route Zone 1" },
  "92103": { neighborhood: "Hillcrest", councilDistrict: 3, routeZone: "Route Zone 3" },
  "92116": { neighborhood: "Kensington", councilDistrict: 9, routeZone: "Route Zone 4" },
  "92107": { neighborhood: "Ocean Beach", councilDistrict: 2, routeZone: "Route Zone 1" },
  "92037": { neighborhood: "La Jolla", councilDistrict: 1, routeZone: "Route Zone 1" },
  "92117": { neighborhood: "Clairemont", councilDistrict: 6, routeZone: "Route Zone 2" },
  "92126": { neighborhood: "Mira Mesa", councilDistrict: 6, routeZone: "Route Zone 5" },
};

/**
 * ESD timestamps are UTC midnight epoch milliseconds (e.g. 1792713600000 -> 2026-10-23T00:00:00.000Z).
 * Extracting UTC year/month/day and normalizing to local noon prevents Pacific Time (UTC-7/UTC-8)
 * from shifting the calendar day backward to the previous evening.
 */
export function parseEsdUtcTimestamp(epochMs: number): Date {
  const d = new Date(epochMs);
  return createLocalNoonDate(
    d.getUTCFullYear(),
    d.getUTCMonth(),
    d.getUTCDate()
  );
}

/**
 * Formats an all-caps street segment from ESD ("7445 JACKSON DR, San Diego, CA 92119")
 * into clean title case ("7445 Jackson Dr, San Diego, CA 92119").
 */
export function formatEsdAddress(rawAddress: string): string {
  const [streetPart, ...rest] = rawAddress.split(",");
  if (!streetPart) return rawAddress.trim();

  const titledStreet = streetPart
    .trim()
    .split(/\s+/)
    .map((word) => {
      if (/^\d+$/.test(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");

  return [titledStreet, ...rest.map((s) => s.trim())].join(", ");
}

/**
 * Extracts the street portion before the first comma (e.g. "7445 Jackson Dr").
 */
export function extractStreetAddress(address: string): string {
  const [streetPart] = address.split(",");
  return streetPart ? streetPart.trim() : address.trim();
}

/**
 * Extracts a short street name without the house number (e.g. "Jackson Dr").
 */
export function extractStreetLabel(address: string): string {
  return extractStreetAddress(address).replace(/^\d+\s+/, "");
}

/**
 * Extracts a 5-digit ZIP code from a formatted San Diego address, ignoring
 * 5-digit street numbers at the start of the address.
 */
export function extractZipCode(address: string): string {
  const afterComma = address.includes(",")
    ? address.slice(address.indexOf(",") + 1)
    : address;
  const match =
    afterComma.match(/\b(92\d{3})\b/) ?? afterComma.match(/\b(\d{5})\b/);
  return match ? match[1] : "";
}

/**
 * Converts a single ESD site record into a normalized schedule model.
 */
export function parseEsdSiteRecord(record: ESDSiteRecord): ParsedESDSite {
  const address = formatEsdAddress(record.Site_Address__c);
  const streetLabel = extractStreetLabel(address);
  const zipCode = extractZipCode(address);
  const dayIndex = parseDayNameToIndex(record.Refuse_Day_Of_WeekF__c);
  const pickupDay = INDEX_TO_WEEKDAY[dayIndex];

  const refuseNextDate = parseEsdUtcTimestamp(
    record.Refuse_Next_Collections_Date__c
  );
  const recycleNextDate = parseEsdUtcTimestamp(
    record.Recycle_Next_Collections_Date__c
  );
  const organicsNextDate = parseEsdUtcTimestamp(
    record.Organics_Next_Collections_Date__c
  );

  return {
    address,
    streetLabel,
    zipCode,
    pickupDay,
    refuseNextDate,
    recycleNextDate,
    organicsNextDate,
    recyclingAnchor: recycleNextDate,
    recycleWeekCode: record.Recycle_Week__c,
    isEligible: record.Status__c.toLowerCase() === "eligible for services",
    status: record.Status__c,
    coordinates: {
      lat: record.Geolocation_ESRI__Latitude__s,
      lng: record.Geolocation_ESRI__Longitude__s,
    },
    routes: {
      refuse: record.Refuse_Route_Id__c,
      recycle: record.Recycle_Route__c,
      organics: record.Organics_Route__c,
    },
  };
}

/**
 * Unwraps the Visualforce Remoting array response from `CollectionMapLookupController.getSitesByAddress`.
 */
export function parseEsdLookupResponse(
  payload: ESDLookupResponse
): ParsedESDSite[] {
  if (!Array.isArray(payload)) return [];
  const sites: ParsedESDSite[] = [];

  for (const envelope of payload) {
    if (envelope?.statusCode === 200 && Array.isArray(envelope.result)) {
      for (const record of envelope.result) {
        sites.push(parseEsdSiteRecord(record));
      }
    }
  }

  return sites;
}

/**
 * Converts an ESD site record directly into a UI `CollectionProfile`.
 */
export function esdSiteToCollectionProfile(
  record: ESDSiteRecord,
  overrides?: Partial<
    Pick<
      CollectionProfile,
      "id" | "pillLabel" | "neighborhood" | "councilDistrict" | "routeZone"
    >
  >
): CollectionProfile {
  const site = parseEsdSiteRecord(record);
  const streetAddress = extractStreetAddress(site.address);
  const fallbackMeta = ZIP_COMMUNITY_META[site.zipCode] ?? {
    neighborhood: "San Diego",
    councilDistrict: 3,
    routeZone: `Route Zone ${site.routes.refuse.slice(0, 1) || "1"}`,
  };

  return {
    id: overrides?.id ?? slugify(streetAddress),
    pillLabel: overrides?.pillLabel ?? streetAddress,
    address: site.address,
    streetLabel: site.streetLabel,
    neighborhood: overrides?.neighborhood ?? fallbackMeta.neighborhood,
    councilDistrict:
      overrides?.councilDistrict ?? fallbackMeta.councilDistrict,
    routeZone: overrides?.routeZone ?? fallbackMeta.routeZone,
    pickupDay: site.pickupDay,
    recyclingAnchor: site.recyclingAnchor,
    esdRoutes: site.routes,
    recycleWeekCode: site.recycleWeekCode,
    coordinates: site.coordinates,
  };
}

/**
 * Filters a list of CollectionProfiles using the same prefix + token matching rules
 * as the City of San Diego's `CollectionMapLookupController.getSitesByAddress` lookup.
 */
export function searchCollectionProfiles(
  profiles: CollectionProfile[],
  rawQuery: string,
  limit = 6
): CollectionProfile[] {
  const query = rawQuery.trim().toLowerCase();
  if (!query) return [];

  // Score profiles: exact prefix match on street address > prefix on street name > neighborhood/zip match
  const scored: { profile: CollectionProfile; score: number }[] = [];

  for (const profile of profiles) {
    const fullLower = profile.address.toLowerCase();
    const pillLower = profile.pillLabel.toLowerCase();
    const streetLower = profile.streetLabel.toLowerCase();
    const neighborhoodLower = profile.neighborhood.toLowerCase();

    if (fullLower === query || pillLower === query) {
      scored.push({ profile, score: 100 });
    } else if (fullLower.startsWith(query) || pillLower.startsWith(query)) {
      scored.push({ profile, score: 90 });
    } else if (streetLower.startsWith(query)) {
      scored.push({ profile, score: 80 });
    } else if (neighborhoodLower.startsWith(query)) {
      scored.push({ profile, score: 70 });
    } else if (
      fullLower.includes(query) ||
      neighborhoodLower.includes(query)
    ) {
      scored.push({ profile, score: 50 });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.profile);
}
