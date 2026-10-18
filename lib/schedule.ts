/**
 * Collection schedule helpers built on top of the ESD holiday slide engine.
 *
 * - Trash (Black) + Organics (Green) are collected weekly.
 * - Recycling (Blue) is collected bi-weekly, anchored to a known "on" week.
 * - Every pickup date is passed through `getEffectivePickupDate` so holiday
 *   slides are applied consistently across the hero, timeline, and .ics export.
 */
import {
  getMondayOfWeek,
  getUpcomingPickups,
  normalizeToLocalNoon,
  type DayName,
  type PickupCalculationResult,
  type WeekdayName,
} from "@/lib/holidays";

export interface CollectionProfile {
  id: string;
  /** Short label used on the quick-filter pill. */
  pillLabel: string;
  /** Full display address. */
  address: string;
  /** Street name used in holiday alert copy (e.g., "Jackson Dr"). */
  streetLabel: string;
  /** Neighborhood / community name (e.g., "San Carlos"). */
  neighborhood: string;
  /** City Council district number. */
  councilDistrict: number;
  /** ESD collection route zone label. */
  routeZone: string;
  /** Regular (non-holiday) collection weekday. */
  pickupDay: WeekdayName;
  /** Any regular scheduled pickup date that falls in a recycling "on" week. */
  recyclingAnchor: Date;
  /** Optional ESD route IDs from CollectionMapLookupController.getSitesByAddress. */
  esdRoutes?: {
    refuse: string;
    recycle: string;
    organics: string;
  };
  /** Optional ESD Recycle_Week__c code ("O" or "E"). */
  recycleWeekCode?: string;
  /** Optional ESRI coordinates from ESD lookup. */
  coordinates?: {
    lat: number;
    lng: number;
  };
  /** Optional Salesforce 18-char ESD Site ID from Get It Done / CollectionDetail. */
  esdSiteId?: string;
  /** Optional ISO dates for next Trash, Recycling, and Organics pickups from live ESD. */
  esdNextDates?: {
    refuse: string;
    recycle: string;
    organics: string;
  };
  /** True when schedule was pulled live from City of San Diego ESD. */
  isLiveEsd?: boolean;
}

export interface CollectionEvent {
  pickup: PickupCalculationResult;
  recycling: boolean;
}

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const SHORT_MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DAY_NAMES: readonly DayName[] = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

/** Whole calendar days between two dates (DST-safe via local-noon normalization). */
export function calendarDaysBetween(from: Date, to: Date): number {
  const a = normalizeToLocalNoon(from).getTime();
  const b = normalizeToLocalNoon(to).getTime();
  return Math.round((b - a) / MS_PER_DAY);
}

/**
 * Bi-weekly recycling check. Compares the *regular* scheduled week (not the
 * holiday-shifted date) against the anchor week, so a +1 day slide never
 * flips the recycling cadence.
 */
export function isRecyclingWeek(scheduledDate: Date, anchor: Date): boolean {
  const weeks = Math.round(
    calendarDaysBetween(getMondayOfWeek(anchor), getMondayOfWeek(scheduledDate)) / 7
  );
  return ((weeks % 2) + 2) % 2 === 0;
}

/** Upcoming collection events (holiday-adjusted) starting at `referenceDate`. */
export function getCollectionEvents(
  profile: CollectionProfile,
  referenceDate: Date,
  count: number
): CollectionEvent[] {
  return getUpcomingPickups(
    profile.pickupDay,
    referenceDate,
    count,
    profile.streetLabel
  ).map((pickup) => ({
    pickup,
    recycling: isRecyclingWeek(pickup.originalDate, profile.recyclingAnchor),
  }));
}

/** "Nov 28" */
export function formatShortDate(date: Date): string {
  return `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}`;
}

/** "Nov" */
export function formatShortMonth(date: Date): string {
  return SHORT_MONTHS[date.getMonth()];
}

/** "Saturday, Nov 28" */
export function formatPickupMorning(date: Date): string {
  return `${DAY_NAMES[date.getDay()]}, ${formatShortDate(date)}`;
}

/** "Saturday, Nov 28" */
export function formatDayDate(date: Date): string {
  return `${DAY_NAMES[date.getDay()]}, ${formatShortDate(date)}`;
}

/** "Fri 10/23/2026" - Matches the City of San Diego ESD portal */
export function formatCityDate(date: Date): string {
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][date.getDay()];
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");
  const year = date.getFullYear();
  return `${weekday} ${month}/${day}/${year}`;
}

/**
 * When the carts need to go out, relative to `now`:
 * 0 days → "This Morning", 1 day → "Tonight", otherwise "<Weekday> Night".
 */
export function getPutOutPhrase(pickupDate: Date, now: Date): string {
  const days = calendarDaysBetween(now, pickupDate);
  if (days <= 0) return "This Morning";
  if (days === 1) return "Tonight";
  const evening = new Date(pickupDate);
  evening.setDate(evening.getDate() - 1);
  return `${DAY_NAMES[evening.getDay()]} Night`;
}

/** Strips the trailing " Day" from holiday names ("Thanksgiving Day" → "Thanksgiving"). */
export function shortHolidayName(name: string): string {
  return name === "New Year's Day" ? name : name.replace(/ Day$/, "");
}

/** "Thanksgiving on Thursday shifts your Friday pickup to Saturday, Nov 28." */
export function formatHolidayShiftMessage(
  pickup: PickupCalculationResult
): string | null {
  if (!pickup.isDelayed || !pickup.holiday) return null;
  const holidayDay = DAY_NAMES[pickup.holiday.dayOfWeek];
  return `${shortHolidayName(pickup.holiday.name)} on ${holidayDay} shifts your ${pickup.originalDayName} pickup to ${pickup.actualDayName}, ${formatShortDate(pickup.actualDate)}.`;
}

/** URL/file-safe slug: "7445 Jackson Dr, San Diego" → "7445-jackson-dr-san-diego". */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
