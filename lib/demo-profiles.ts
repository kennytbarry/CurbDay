/**
 * San Diego ESD address dataset (`CollectionMapLookupController.getSitesByAddress` schema)
 * powering the interactive search, autocomplete prefill, and quick-filter pills.
 */
import { createLocalNoonDate } from "@/lib/holidays";
import {
  esdSiteToCollectionProfile,
  type ESDLookupResponse,
} from "@/lib/esd";
import type { CollectionProfile } from "@/lib/schedule";

/**
 * Representative JSON response payload in the exact City of San Diego ESD
 * `CollectionMapLookupController.getSitesByAddress` format.
 */
export const SAN_DIEGO_ESD_PAYLOAD: ESDLookupResponse = [
  {
    statusCode: 200,
    action: "CollectionMapLookupController",
    method: "getSitesByAddress",
    result: [
      {
        Site_Address__c: "7445 JACKSON DR, San Diego, CA 92119",
        Refuse_Next_Collections_Date__c: 1792713600000, // 2026-10-23 (Fri)
        Recycle_Next_Collections_Date__c: 1793318400000, // 2026-10-30 (Fri -> also ON Nov 27)
        Organics_Next_Collections_Date__c: 1792713600000,
        Refuse_Day_Of_WeekF__c: "Fri",
        Recycle_Day_of_WeekF__c: "Fri",
        Organics_Day_Of_WeekF__c: "Fri",
        Recycle_Week__c: "O",
        Status__c: "Eligible for Services",
        Geolocation_ESRI__Latitude__s: 32.801421,
        Geolocation_ESRI__Longitude__s: -117.018542,
        Refuse_Route_Id__c: "2208",
        Recycle_Route__c: "2240",
        Organics_Route__c: "3421",
      },
      {
        Site_Address__c: "1549 EL PRADO, San Diego, CA 92101",
        Refuse_Next_Collections_Date__c: 1792368000000, // 2026-10-19 (Mon)
        Recycle_Next_Collections_Date__c: 1792972800000, // 2026-10-26 (Mon -> also ON Dec 7)
        Organics_Next_Collections_Date__c: 1792368000000,
        Refuse_Day_Of_WeekF__c: "Mon",
        Recycle_Day_of_WeekF__c: "Mon",
        Organics_Day_Of_WeekF__c: "Mon",
        Recycle_Week__c: "E",
        Status__c: "Eligible for Services",
        Geolocation_ESRI__Latitude__s: 32.731382,
        Geolocation_ESRI__Longitude__s: -117.150412,
        Refuse_Route_Id__c: "1104",
        Recycle_Route__c: "1120",
        Organics_Route__c: "3108",
      },
      {
        Site_Address__c: "3825 RAY ST, San Diego, CA 92104",
        Refuse_Next_Collections_Date__c: 1792713600000, // 2026-10-23 (Fri -> OFF Nov 27, ON Dec 4)
        Recycle_Next_Collections_Date__c: 1792713600000,
        Organics_Next_Collections_Date__c: 1792713600000,
        Refuse_Day_Of_WeekF__c: "Fri",
        Recycle_Day_of_WeekF__c: "Fri",
        Organics_Day_Of_WeekF__c: "Fri",
        Recycle_Week__c: "E",
        Status__c: "Eligible for Services",
        Geolocation_ESRI__Latitude__s: 32.747891,
        Geolocation_ESRI__Longitude__s: -117.128945,
        Refuse_Route_Id__c: "1312",
        Recycle_Route__c: "1345",
        Organics_Route__c: "3310",
      },
      {
        Site_Address__c: "4452 INGRAHAM ST, San Diego, CA 92109",
        Refuse_Next_Collections_Date__c: 1792454400000, // 2026-10-20 (Tue)
        Recycle_Next_Collections_Date__c: 1793059200000, // 2026-10-27 (Tue)
        Organics_Next_Collections_Date__c: 1792454400000,
        Refuse_Day_Of_WeekF__c: "Tue",
        Recycle_Day_of_WeekF__c: "Tue",
        Organics_Day_Of_WeekF__c: "Tue",
        Recycle_Week__c: "O",
        Status__c: "Eligible for Services",
        Geolocation_ESRI__Latitude__s: 32.796412,
        Geolocation_ESRI__Longitude__s: -117.241298,
        Refuse_Route_Id__c: "1409",
        Recycle_Route__c: "1422",
        Organics_Route__c: "3402",
      },
      {
        Site_Address__c: "3750 UNIVERSITY AVE, San Diego, CA 92103",
        Refuse_Next_Collections_Date__c: 1792540800000, // 2026-10-21 (Wed)
        Recycle_Next_Collections_Date__c: 1792540800000,
        Organics_Next_Collections_Date__c: 1792540800000,
        Refuse_Day_Of_WeekF__c: "Wed",
        Recycle_Day_of_WeekF__c: "Wed",
        Organics_Day_Of_WeekF__c: "Wed",
        Recycle_Week__c: "E",
        Status__c: "Eligible for Services",
        Geolocation_ESRI__Latitude__s: 32.748401,
        Geolocation_ESRI__Longitude__s: -117.146205,
        Refuse_Route_Id__c: "1305",
        Recycle_Route__c: "1318",
        Organics_Route__c: "3304",
      },
      {
        Site_Address__c: "4126 ADAMS AVE, San Diego, CA 92116",
        Refuse_Next_Collections_Date__c: 1792627200000, // 2026-10-22 (Thu)
        Recycle_Next_Collections_Date__c: 1793232000000, // 2026-10-29 (Thu)
        Organics_Next_Collections_Date__c: 1792627200000,
        Refuse_Day_Of_WeekF__c: "Thu",
        Recycle_Day_of_WeekF__c: "Thu",
        Organics_Day_Of_WeekF__c: "Thu",
        Recycle_Week__c: "O",
        Status__c: "Eligible for Services",
        Geolocation_ESRI__Latitude__s: 32.763412,
        Geolocation_ESRI__Longitude__s: -117.106122,
        Refuse_Route_Id__c: "2104",
        Recycle_Route__c: "2119",
        Organics_Route__c: "3209",
      },
      {
        Site_Address__c: "4944 NEWPORT AVE, San Diego, CA 92107",
        Refuse_Next_Collections_Date__c: 1792368000000, // 2026-10-19 (Mon)
        Recycle_Next_Collections_Date__c: 1792368000000,
        Organics_Next_Collections_Date__c: 1792368000000,
        Refuse_Day_Of_WeekF__c: "Mon",
        Recycle_Day_of_WeekF__c: "Mon",
        Organics_Day_Of_WeekF__c: "Mon",
        Recycle_Week__c: "O",
        Status__c: "Eligible for Services",
        Geolocation_ESRI__Latitude__s: 32.746812,
        Geolocation_ESRI__Longitude__s: -117.250144,
        Refuse_Route_Id__c: "1206",
        Recycle_Route__c: "1231",
        Organics_Route__c: "3115",
      },
      {
        Site_Address__c: "7946 IVANHOE AVE, San Diego, CA 92037",
        Refuse_Next_Collections_Date__c: 1792540800000, // 2026-10-21 (Wed)
        Recycle_Next_Collections_Date__c: 1793145600000, // 2026-10-28 (Wed)
        Organics_Next_Collections_Date__c: 1792540800000,
        Refuse_Day_Of_WeekF__c: "Wed",
        Recycle_Day_of_WeekF__c: "Wed",
        Organics_Day_Of_WeekF__c: "Wed",
        Recycle_Week__c: "O",
        Status__c: "Eligible for Services",
        Geolocation_ESRI__Latitude__s: 32.847319,
        Geolocation_ESRI__Longitude__s: -117.274211,
        Refuse_Route_Id__c: "1502",
        Recycle_Route__c: "1519",
        Organics_Route__c: "3501",
      },
    ],
  },
];

const rawRecords = SAN_DIEGO_ESD_PAYLOAD[0].result;

/**
 * Fixed "now" for the demo: Friday evening, Nov 27, 2026 (day after
 * Thanksgiving). Pinned so server and client render identically and so the
 * Thanksgiving slide is always visible in the preview.
 */
export const DEMO_NOW = createLocalNoonDate(2026, 10, 27);

export const DEMO_PROFILES: CollectionProfile[] = [
  esdSiteToCollectionProfile(rawRecords[0], {
    id: "jackson",
    pillLabel: "7445 Jackson Dr",
  }),
  esdSiteToCollectionProfile(rawRecords[1], {
    id: "el-prado",
    pillLabel: "1549 El Prado",
  }),
  esdSiteToCollectionProfile(rawRecords[2], {
    id: "north-park",
    pillLabel: "3825 Ray St",
  }),
  ...rawRecords.slice(3).map((rec) => esdSiteToCollectionProfile(rec)),
];

export const QUICK_FILTER_IDS = ["jackson", "el-prado", "north-park"] as const;
