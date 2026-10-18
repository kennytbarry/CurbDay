import { describe, expect, it } from "vitest";
import { createLocalNoonDate, formatDateKey } from "@/lib/holidays";
import {
  DEMO_NOW,
  DEMO_PROFILES,
  SAN_DIEGO_ESD_PAYLOAD,
} from "@/lib/demo-profiles";
import {
  buildProfileForSanDiegoAddress,
  hydrateCollectionProfile,
  normalizeArcGisAddress,
} from "@/lib/arcgis";
import {
  parseEsdLookupResponse,
  parseEsdUtcTimestamp,
  searchCollectionProfiles,
} from "@/lib/esd";
import {
  parseCollectionDetailHtml,
  parseStreetForEsdLookup,
} from "@/lib/esd-live";
import {
  buildCollectionCalendar,
  buildStreetSweepingCalendar,
  escapeIcsText,
} from "@/lib/ics-generator";
import { getSweepingDates } from "@/lib/streetSweeping";
import {
  getCollectionEvents,
  getPutOutPhrase,
  isRecyclingWeek,
} from "@/lib/schedule";

const jackson = DEMO_PROFILES.find((p) => p.id === "jackson")!;

describe("lib/esd.ts & lib/arcgis.ts (San Diego ESD & GIS Address Autocomplete)", () => {
  it("parses UTC midnight epoch timestamps without Pacific Time off-by-one drift", () => {
    const refuseDate = parseEsdUtcTimestamp(1792713600000);
    const recycleDate = parseEsdUtcTimestamp(1793318400000);

    expect(formatDateKey(refuseDate)).toBe("2026-10-23");
    expect(formatDateKey(recycleDate)).toBe("2026-10-30");
  });

  it("parses the San Diego ESD payload accurately", () => {
    const sites = parseEsdLookupResponse(SAN_DIEGO_ESD_PAYLOAD);
    const [site] = sites;

    expect(sites.length).toBeGreaterThanOrEqual(8);
    expect(site.address).toBe("7445 Jackson Dr, San Diego, CA 92119");
    expect(site.streetLabel).toBe("Jackson Dr");
    expect(site.pickupDay).toBe("Friday");
    expect(site.recycleWeekCode).toBe("O");
    expect(site.isEligible).toBe(true);
    expect(site.routes).toEqual({
      refuse: "2208",
      recycle: "2240",
      organics: "3421",
    });
    expect(site.coordinates.lat).toBeCloseTo(32.801421, 5);
    expect(site.coordinates.lng).toBeCloseTo(-117.018542, 5);
  });

  it("returns no unsolicited suggestions when the search query is empty", () => {
    expect(searchCollectionProfiles(DEMO_PROFILES, "")).toEqual([]);
    expect(searchCollectionProfiles(DEMO_PROFILES, "   ")).toEqual([]);
  });

  it("ranks address prefix and neighborhood matches when typing", () => {
    const byStreetNumber = searchCollectionProfiles(DEMO_PROFILES, "7445 J");
    expect(byStreetNumber[0]?.address).toBe(
      "7445 Jackson Dr, San Diego, CA 92119"
    );

    const byStreetName = searchCollectionProfiles(DEMO_PROFILES, "Ingraham");
    expect(byStreetName[0]?.address).toBe(
      "4452 Ingraham St, San Diego, CA 92109"
    );

    const byNeighborhood = searchCollectionProfiles(DEMO_PROFILES, "La Jolla");
    expect(byNeighborhood[0]?.address).toBe(
      "7946 Ivanhoe Ave, San Diego, CA 92037"
    );
  });

  it("normalizes live City of San Diego ArcGIS locator strings and builds profiles for any San Diego address", () => {
    expect(normalizeArcGisAddress("10455 POMERADO RD, SD, 92131")).toBe(
      "10455 Pomerado Rd, San Diego, CA 92131"
    );

    const scrippsProfile = buildProfileForSanDiegoAddress({
      address: "10455 POMERADO RD, SD, 92131",
      lat: 32.9124,
      lng: -117.1052,
    });

    expect(scrippsProfile.address).toBe(
      "10455 Pomerado Rd, San Diego, CA 92131"
    );
    expect(scrippsProfile.neighborhood).toBe("Scripps Ranch");
    expect(scrippsProfile.councilDistrict).toBe(5);
    expect(scrippsProfile.pickupDay).toBe("Wednesday");
    expect(scrippsProfile.esdRoutes?.refuse).toMatch(/^26\d{2}$/);

    const hydrated = hydrateCollectionProfile({
      ...scrippsProfile,
      recyclingAnchor: scrippsProfile.recyclingAnchor.toISOString(),
    });
    expect(hydrated.recyclingAnchor).toBeInstanceOf(Date);
  });

  it("parses street components and live ESD CollectionDetail HTML into a CollectionProfile", () => {
    expect(
      parseStreetForEsdLookup("738 W Upas St, San Diego, CA 92103")
    ).toEqual({
      streetNumber: "738",
      streetName: "Upas",
      rawStreetName: "W Upas",
      suffix: "St",
    });

    const sampleDetailHtml = `
      <p class="subheading">3520 RAY ST, San Diego, CA 92104</p>
      <div id="trash-date"><p class="day"> Thursday</p><p class="date"> 10/22/2026</p></div>
      <div id="recycle-date"><p class="day"><span> Thursday</span></p><p class="date"><span> 10/22/2026</span></p></div>
      <div id="organics-date"><p class="day"> Thursday</p><p class="date"> 10/22/2026</p></div>
      <a href="https://www.sandiego.gov/sites/default/files/2025-12/curbsider-cl1.pdf">Calendar</a>
    `;

    const liveSchedule = parseCollectionDetailHtml(sampleDetailHtml, {
      siteId: "a4Ocs000001APAwEAO",
      status: "Eligible for Services",
      address: "3520 RAY ST, San Diego, CA 92104",
      itemNo: "1",
      familyType: "Single Family",
    });

    expect(liveSchedule).not.toBeNull();
    expect(liveSchedule?.pickupDay).toBe("Thursday");
    expect(liveSchedule?.pickupDayCode).toBe("Thu");
    expect(formatDateKey(liveSchedule!.refuseNextDate)).toBe("2026-10-22");
    expect(formatDateKey(liveSchedule!.recycleNextDate)).toBe("2026-10-22");

    const liveProfile = buildProfileForSanDiegoAddress({
      address: "3520 RAY ST, SD, 92104",
      lat: 32.743,
      lng: -117.129,
      councilDistrict: 3,
      liveSchedule,
    });

    expect(liveProfile.isLiveEsd).toBe(true);
    expect(liveProfile.esdSiteId).toBe("a4Ocs000001APAwEAO");
    expect(liveProfile.pickupDay).toBe("Thursday");
    expect(formatDateKey(liveProfile.recyclingAnchor)).toBe("2026-10-22");
  });
});

describe("lib/schedule.ts", () => {
  it("alternates recycling weeks relative to the ESD Recycle_Next_Collections_Date__c anchor", () => {
    const anchor = jackson.recyclingAnchor; // 2026-10-30 from 1793318400000
    expect(isRecyclingWeek(createLocalNoonDate(2026, 9, 23), anchor)).toBe(false); // Oct 23
    expect(isRecyclingWeek(createLocalNoonDate(2026, 9, 30), anchor)).toBe(true); // Oct 30
    expect(isRecyclingWeek(createLocalNoonDate(2026, 10, 27), anchor)).toBe(true); // Nov 27
    expect(isRecyclingWeek(createLocalNoonDate(2026, 11, 4), anchor)).toBe(false); // Dec 4
    expect(isRecyclingWeek(createLocalNoonDate(2026, 11, 11), anchor)).toBe(true); // Dec 11
    // Across the March DST change
    expect(isRecyclingWeek(createLocalNoonDate(2027, 2, 19), anchor)).toBe(true);
  });

  it("keeps recycling cadence on the regular week even when shifted by a holiday", () => {
    const events = getCollectionEvents(jackson, DEMO_NOW, 4);
    expect(events.map((e) => [e.pickup.actualDateKey, e.recycling])).toEqual([
      ["2026-11-28", true],
      ["2026-12-04", false],
      ["2026-12-11", true],
      ["2026-12-18", false],
    ]);
  });

  it("phrases put-out timing relative to now", () => {
    expect(getPutOutPhrase(createLocalNoonDate(2026, 10, 28), DEMO_NOW)).toBe(
      "Tonight"
    );
    expect(getPutOutPhrase(createLocalNoonDate(2026, 10, 30), DEMO_NOW)).toBe(
      "Sunday Night"
    );
    expect(getPutOutPhrase(DEMO_NOW, DEMO_NOW)).toBe("This Morning");
  });
});

describe("lib/ics-generator.ts", () => {
  const ics = buildCollectionCalendar({
    address: "7445 Jackson Dr, San Diego, CA 92119",
    slug: "7445-jackson-dr",
    events: getCollectionEvents(jackson, DEMO_NOW, 52),
    now: new Date(Date.UTC(2026, 9, 17, 12, 0, 0)),
  });

  it("produces a CRLF-delimited VCALENDAR with 52 events", () => {
    expect(ics.startsWith("BEGIN:VCALENDAR\r\nVERSION:2.0\r\n")).toBe(true);
    expect(ics.endsWith("END:VCALENDAR\r\n")).toBe(true);
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(52);
    expect(ics.split("\r\n").every((line) => line.length <= 75)).toBe(true);
  });

  it("bakes in the Thanksgiving slide and a 7 PM evening-before alarm", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20261128");
    expect(ics).toContain("Thanksgiving Day delay");
    expect(ics).toContain("TRIGGER:-PT5H");
    expect(ics).toContain("DTSTAMP:20261017T120000Z");
  });

  it("escapes RFC 5545 TEXT values", () => {
    expect(escapeIcsText("a,b;c\\d\ne")).toBe("a\\,b\\;c\\\\d\\ne");
  });

  it("builds a street sweeping calendar with Move Your Car events and evening alarms", () => {
    const dates = getSweepingDates(
      "1st & 3rd Tuesday (7am - 11am)",
      new Date("2026-10-01T00:00:00Z"),
      6
    );
    expect(dates).toHaveLength(6);

    const sweepIcs = buildStreetSweepingCalendar({
      address: "3825 Ray St, San Diego, CA 92104",
      slug: "3825-ray-st",
      street: "Ray St",
      blockRange: "3800-3899",
      isPosted: true,
      timeWindow: "7am - 11am",
      sides: "Both Sides",
      frequency: "Monthly · 1st & 3rd Tuesday",
      dates,
      now: new Date(Date.UTC(2026, 9, 1, 12, 0, 0)),
    });

    expect(sweepIcs).toContain("Street Sweeping - Move Your Car");
    expect(sweepIcs).toContain("7am - 11am");
    expect(sweepIcs).toContain("TRIGGER:-PT5H");
    expect(sweepIcs.match(/BEGIN:VEVENT/g)).toHaveLength(6);
  });
});
