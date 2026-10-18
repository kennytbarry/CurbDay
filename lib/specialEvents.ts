/**
 * Special Hazardous, Universal & Bulky Waste Events and Drop-Off Facilities.
 * City of San Diego Environmental Services Department (ESD).
 */

export interface SpecialEvent {
  id: string;
  date: string; // YYYY-MM-DD
  displayDate: string;
  startTime: string;
  endTime: string;
  venueName: string;
  streetAddress: string;
  region: string;
  acceptedItems: string[];
  prohibitedItems: string[];
  appointmentRequired: boolean;
}

export interface PermanentFacility {
  id: string;
  name: string;
  schedule: string;
  address: string;
  phone: string;
  appointmentRequired: boolean;
  acceptedCategories: string[];
  specialRules: string[];
  appointmentUrl: string;
}

export interface SpecialEventsData {
  upcomingEvents: SpecialEvent[];
  permanentFacilities: PermanentFacility[];
  lastSyncedAt: string;
  source: "live" | "fallback";
}

export type EventCategoryFilter =
  | "all"
  | "batteries_bulbs_oil"
  | "paint_chemicals"
  | "electronics"
  | "mattresses_bulky";

export const FIVE_ACCEPTED_POPUP_ITEMS = [
  "Household Batteries (AA, AAA, 9V, button cell, lithium-ion)",
  "Automotive & Car Batteries",
  "Fluorescent Tubes & LED Bulbs",
  "Used Motor Oil (in clean, sealed containers)",
  "Used Motor Oil Filters",
] as const;

export const POPUP_PROHIBITED_ITEMS = [
  "No Paint, Stains, or Solvents",
  "No Household Cleaners or Pool Chemicals",
  "No TVs, Computers, or Electronics",
  "No Furniture, Mattresses, or Bulky Appliances",
] as const;

/**
 * Official 2026–2027 City of San Diego Municipal Ground-Truth Fallback Seed.
 * Verified against sandiego.gov/environmental-services/ep/events/one-day
 */
export const FALLBACK_EVENTS_DATA: SpecialEventsData = {
  lastSyncedAt: "2026-10-18T19:00:00Z",
  source: "fallback",
  upcomingEvents: [
    {
      id: "balboa-park-oct-2026",
      date: "2026-10-24",
      displayDate: "Saturday, Oct 24, 2026",
      startTime: "9:00 AM",
      endTime: "1:00 PM",
      venueName: "Balboa Park — Inspiration Point Parking Lot",
      streetAddress: "Corner of Park Blvd. & Presidents Way, San Diego, CA 92101",
      region: "Central / Balboa Park",
      acceptedItems: [...FIVE_ACCEPTED_POPUP_ITEMS],
      prohibitedItems: [...POPUP_PROHIBITED_ITEMS],
      appointmentRequired: false,
    },
    {
      id: "vista-del-mar-nov-2026",
      date: "2026-11-14",
      displayDate: "Saturday, Nov 14, 2026",
      startTime: "9:00 AM",
      endTime: "1:00 PM",
      venueName: "Vista Del Mar Middle School (North Parking Lot)",
      streetAddress: "4885 Del Sol Blvd, San Diego, CA 92154",
      region: "South Bay / Otay Mesa",
      acceptedItems: [...FIVE_ACCEPTED_POPUP_ITEMS],
      prohibitedItems: [...POPUP_PROHIBITED_ITEMS],
      appointmentRequired: false,
    },
    {
      id: "balboa-park-dec-2026",
      date: "2026-12-19",
      displayDate: "Saturday, Dec 19, 2026",
      startTime: "9:00 AM",
      endTime: "1:00 PM",
      venueName: "Balboa Park — Inspiration Point Parking Lot",
      streetAddress: "Corner of Park Blvd. & Presidents Way, San Diego, CA 92101",
      region: "Central / Balboa Park",
      acceptedItems: [...FIVE_ACCEPTED_POPUP_ITEMS],
      prohibitedItems: [...POPUP_PROHIBITED_ITEMS],
      appointmentRequired: false,
    },
    {
      id: "miramar-college-feb-2027",
      date: "2027-02-13",
      displayDate: "Saturday, Feb 13, 2027",
      startTime: "9:00 AM",
      endTime: "1:00 PM",
      venueName: "San Diego Miramar College (Parking Lot 2)",
      streetAddress: "10440 Black Mountain Rd, San Diego, CA 92126",
      region: "North City / Mira Mesa",
      acceptedItems: [...FIVE_ACCEPTED_POPUP_ITEMS],
      prohibitedItems: [...POPUP_PROHIBITED_ITEMS],
      appointmentRequired: false,
    },
  ],
  permanentFacilities: [
    {
      id: "miramar-hhw",
      name: "Miramar Hazardous Waste Transfer Facility",
      schedule: "Every Wednesday & Saturday, 9:00 AM – 3:00 PM",
      address: "5161 Convoy St, San Diego, CA 92111",
      phone: "858-694-7000",
      appointmentRequired: true,
      appointmentUrl: "https://getitdone.sandiego.gov/HazmatNewReportPage",
      acceptedCategories: [
        "Paint, Stains & Thinners (latex & oil-based)",
        "Household Cleaners, Bleach & Drain Opener",
        "Pesticides, Herbicides & Pool Chemicals",
        "Batteries (all types) & Fluorescent/LED Tubes",
        "Motor Oil, Oil Filters & Antifreeze",
        "Home-Generated Sharps (in rigid puncture-resistant containers)",
      ],
      specialRules: [
        "Appointment Required (online via Get It Done). Free for City of San Diego residents.",
        "State law legal transport limit: Maximum 15 gallons of liquid or 125 lbs total weight per trip.",
        "Individual containers must not exceed 5 gallons.",
        "Residents must remain inside vehicle; staff unloads from trunk or truck bed.",
      ],
    },
    {
      id: "miramar-recycling-center",
      name: "Miramar Recycling Center & Greenery",
      schedule: "Monday – Saturday, 7:00 AM – 4:00 PM",
      address: "5165 Convoy St, San Diego, CA 92111",
      phone: "858-694-7000",
      appointmentRequired: false,
      appointmentUrl: "https://www.sandiego.gov/environmental-services/miramar",
      acceptedCategories: [
        "Free Mattress & Box Spring Drop-Off (Mon–Fri, 7 AM – 3 PM, up to 4 units per visit)",
        "Electronics & E-Waste (TVs, monitors, laptops, printers, phones)",
        "Large Appliances & Scrap Metal (self-haul drop-off)",
        "Clean Cardboard, Scrap Metal & Rigid Plastics",
      ],
      specialRules: [
        "Curbside bulky item collection was paused by the City in June 2026. Do NOT leave appliances or furniture at the curb.",
        "Self-haul to Miramar or arrange commercial hauler pickup to avoid illegal dumping citations.",
        "Mattress drop-off is free for residents under the California Bye Bye Mattress program.",
      ],
    },
  ],
};

/**
 * Generates an RFC 5545 single-event ICS string for a Saturday collection event.
 */
export function generateIcsForSpecialEvent(event: SpecialEvent): string {
  // Parse YYYY-MM-DD
  const [year, month, day] = event.date.split("-").map(Number);
  // 9:00 AM - 1:00 PM Pacific Time (UTC-7 or UTC-8 depending on daylight saving)
  // For standard calendar import, floating local time format (YYYYMMDDTHHMMSS) works universally
  const pad = (n: number) => String(n).padStart(2, "0");
  const dtStart = `${year}${pad(month)}${pad(day)}T090000`;
  const dtEnd = `${year}${pad(month)}${pad(day)}T130000`;
  const uid = `${event.id}@curbday-sd.vercel.app`;
  const nowStamp = new Date()
    .toISOString()
    .replace(/[-:]/g, "")
    .replace(/\.\d{3}/, "");

  const descriptionLines = [
    `City of San Diego Hazardous & Universal Waste One-Day Collection Event`,
    `Hours: ${event.startTime} - ${event.endTime}`,
    `Location: ${event.venueName} (${event.streetAddress})`,
    ``,
    `ACCEPTED ITEMS (5 CATEGORIES ONLY):`,
    ...event.acceptedItems.map((item) => `- ${item}`),
    ``,
    `NOT ACCEPTED AT POP-UPS (Must go to Miramar Facility):`,
    `- No paint, stains, chemicals, electronics, furniture, or mattresses`,
    ``,
    `IMPORTANT: Bring proof of City of San Diego residency (utility bill or driver's license).`,
    `More info: https://curbday-sd.vercel.app`,
  ];

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CurbDay//San Diego Waste Events//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:San Diego Drop-Off: ${event.venueName}`,
    `DESCRIPTION:${descriptionLines.join("\\n")}`,
    `LOCATION:${event.streetAddress}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
}
