/**
 * City of San Diego Environmental Services Department (ESD)
 * Holiday Slide Rules Engine (PRD Section 3.3)
 *
 * Observed Holidays (5 total):
 * 1. New Year's Day (January 1)
 * 2. Memorial Day (Last Monday in May)
 * 3. Labor Day (First Monday in September)
 * 4. Thanksgiving Day (Fourth Thursday in November)
 * 5. Christmas Day (December 25)
 *
 * Shift Rule:
 * - If a holiday falls on Saturday (6) or Sunday (0), collection schedules are unaffected.
 * - If a holiday falls on Monday (1) through Friday (5):
 *   - Any scheduled pickup in that week occurring ON or AFTER that weekday shifts by +1 day.
 *   - Any scheduled pickup earlier in the week prior to the holiday is unaffected.
 */

export type HolidayName =
  | "New Year's Day"
  | "Memorial Day"
  | "Labor Day"
  | "Thanksgiving Day"
  | "Christmas Day";

export type DayName =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export type WeekdayName =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday";

export interface ESDHoliday {
  name: HolidayName;
  date: Date;
  dateKey: string;
  year: number;
  dayOfWeek: number; // 0 = Sunday ... 6 = Saturday
  isWeekday: boolean; // true if Monday (1) through Friday (5)
}

export interface PickupCalculationResult {
  originalDate: Date;
  actualDate: Date;
  originalDateKey: string;
  actualDateKey: string;
  originalDayName: DayName;
  actualDayName: DayName;
  isDelayed: boolean;
  shiftDays: 0 | 1;
  holiday?: ESDHoliday;
  holidayName?: HolidayName;
  alertMessage?: string;
}

const DAY_NAMES: readonly DayName[] = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const SHORT_MONTH_NAMES = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

/**
 * Creates a local Date normalized to 12:00:00.000 noon to prevent DST boundary shifts.
 */
export function createLocalNoonDate(
  year: number,
  monthIndex: number,
  day: number
): Date {
  return new Date(year, monthIndex, day, 12, 0, 0, 0);
}

/**
 * Normalizes any Date instance to local calendar date at 12:00 noon.
 */
export function normalizeToLocalNoon(date: Date): Date {
  return createLocalNoonDate(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

/**
 * Formats a Date as YYYY-MM-DD in local calendar time.
 */
export function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/**
 * Checks whether two Date objects represent the exact same local calendar date.
 */
export function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/**
 * Returns a Date set to local noon representing the current calendar date in San Diego (America/Los_Angeles).
 * Ensures server-side cron jobs executing on UTC servers (e.g. 02:00 UTC) accurately evaluate
 * local Pacific evening dates instead of advancing to the UTC next day.
 */
export function getPacificCalendarDate(now = new Date()): Date {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(now);
  let year = now.getFullYear();
  let month = now.getMonth() + 1;
  let day = now.getDate();

  for (const part of parts) {
    if (part.type === "year") year = parseInt(part.value, 10);
    if (part.type === "month") month = parseInt(part.value, 10);
    if (part.type === "day") day = parseInt(part.value, 10);
  }

  return createLocalNoonDate(year, month - 1, day);
}

/**
 * Adds a specified number of calendar days to a date (normalized to local noon).
 */
export function addCalendarDays(date: Date, days: number): Date {
  const normalized = normalizeToLocalNoon(date);
  return createLocalNoonDate(
    normalized.getFullYear(),
    normalized.getMonth(),
    normalized.getDate() + days
  );
}

/**
 * Finds the Nth occurrence (1-indexed) of a weekday (0=Sun..6=Sat) in a given month.
 */
function getNthWeekdayOfMonth(
  year: number,
  monthIndex: number,
  targetDayOfWeek: number,
  nth: number
): Date {
  const firstDayOfMonth = createLocalNoonDate(year, monthIndex, 1);
  const firstDayOfWeek = firstDayOfMonth.getDay();
  const offset = (targetDayOfWeek - firstDayOfWeek + 7) % 7;
  const dayOfMonth = 1 + offset + (nth - 1) * 7;
  return createLocalNoonDate(year, monthIndex, dayOfMonth);
}

/**
 * Finds the last occurrence of a weekday (0=Sun..6=Sat) in a given month.
 */
function getLastWeekdayOfMonth(
  year: number,
  monthIndex: number,
  targetDayOfWeek: number
): Date {
  // Day 0 of monthIndex + 1 is the last day of monthIndex
  const lastDayOfMonth = createLocalNoonDate(year, monthIndex + 1, 0);
  const lastDayOfWeek = lastDayOfMonth.getDay();
  const offset = (lastDayOfWeek - targetDayOfWeek + 7) % 7;
  const dayOfMonth = lastDayOfMonth.getDate() - offset;
  return createLocalNoonDate(year, monthIndex, dayOfMonth);
}

function buildHoliday(name: HolidayName, date: Date): ESDHoliday {
  const normalized = normalizeToLocalNoon(date);
  const dayOfWeek = normalized.getDay();
  return {
    name,
    date: normalized,
    dateKey: formatDateKey(normalized),
    year: normalized.getFullYear(),
    dayOfWeek,
    isWeekday: dayOfWeek >= 1 && dayOfWeek <= 5,
  };
}

/**
 * Returns all 5 observed City of San Diego ESD holidays for a given calendar year
 * in chronological order.
 */
export function getHolidaysForYear(year: number): ESDHoliday[] {
  const newYearsDay = createLocalNoonDate(year, 0, 1); // Jan 1
  const memorialDay = getLastWeekdayOfMonth(year, 4, 1); // Last Monday in May
  const laborDay = getNthWeekdayOfMonth(year, 8, 1, 1); // First Monday in Sep
  const thanksgivingDay = getNthWeekdayOfMonth(year, 10, 4, 4); // Fourth Thursday in Nov
  const christmasDay = createLocalNoonDate(year, 11, 25); // Dec 25

  return [
    buildHoliday("New Year's Day", newYearsDay),
    buildHoliday("Memorial Day", memorialDay),
    buildHoliday("Labor Day", laborDay),
    buildHoliday("Thanksgiving Day", thanksgivingDay),
    buildHoliday("Christmas Day", christmasDay),
  ];
}

/**
 * Parses a day name (e.g., "Friday", "FRI", "5") or number (1-5) into a weekday index (1=Monday .. 5=Friday).
 */
export function parseDayNameToIndex(dayInput: string | number): number {
  if (typeof dayInput === "number") {
    if (dayInput >= 1 && dayInput <= 5) return dayInput;
    throw new Error(
      `Invalid pickup weekday number: ${dayInput}. Expected 1 (Monday) through 5 (Friday).`
    );
  }

  const cleaned = dayInput.trim().toLowerCase();
  const map: Record<string, number> = {
    monday: 1,
    mon: 1,
    tuesday: 2,
    tue: 2,
    tues: 2,
    wednesday: 3,
    wed: 3,
    thursday: 4,
    thu: 4,
    thur: 4,
    thurs: 4,
    friday: 5,
    fri: 5,
  };

  const resolved = map[cleaned];
  if (!resolved) {
    throw new Error(
      `Unrecognized pickup day "${dayInput}". Expected Monday through Friday.`
    );
  }
  return resolved;
}

/**
 * Returns the Monday (normalized to local noon) of the ISO week containing `date`.
 * ISO week runs Monday (1) through Sunday (0).
 */
export function getMondayOfWeek(date: Date): Date {
  const normalized = normalizeToLocalNoon(date);
  const day = normalized.getDay();
  // Convert Sunday (0) to 7 so Monday is always start of week
  const isoDay = day === 0 ? 7 : day;
  return addCalendarDays(normalized, -(isoDay - 1));
}

/**
 * Evaluates whether a scheduled pickup date is shifted by +1 day due to an observed
 * City of San Diego ESD holiday falling on Monday–Friday of that same week on or before
 * the scheduled pickup weekday.
 */
export function getEffectivePickupDate(
  scheduledDate: Date,
  streetLabel?: string
): PickupCalculationResult {
  const originalDate = normalizeToLocalNoon(scheduledDate);
  const originalDayIndex = originalDate.getDay();
  const originalDayName = DAY_NAMES[originalDayIndex];

  // Normal ESD collection only happens Monday (1) through Friday (5).
  // Locate the Monday and Friday of the scheduled pickup's week.
  const weekMonday = getMondayOfWeek(originalDate);
  const weekFriday = addCalendarDays(weekMonday, 4);

  // Gather holidays for the year(s) covered by this Monday–Friday week
  // (handles Dec/Jan cross-year weeks such as Dec 29 – Jan 2).
  const years = new Set<number>([
    weekMonday.getFullYear(),
    weekFriday.getFullYear(),
    originalDate.getFullYear(),
  ]);

  const candidateHolidays: ESDHoliday[] = [];
  for (const yr of years) {
    candidateHolidays.push(...getHolidaysForYear(yr));
  }

  // Find a weekday holiday falling within [weekMonday, weekFriday] AND on or before originalDate.
  const weekMondayTime = weekMonday.getTime();
  const weekFridayTime = weekFriday.getTime();
  const originalTime = originalDate.getTime();

  const matchingHoliday = candidateHolidays.find((h) => {
    if (!h.isWeekday) return false;
    const hTime = h.date.getTime();
    return (
      hTime >= weekMondayTime &&
      hTime <= weekFridayTime &&
      hTime <= originalTime
    );
  });

  if (matchingHoliday && originalDayIndex >= 1 && originalDayIndex <= 5) {
    const actualDate = addCalendarDays(originalDate, 1);
    const actualDayName = DAY_NAMES[actualDate.getDay()];
    const formattedActualShort = `${SHORT_MONTH_NAMES[actualDate.getMonth()]} ${actualDate.getDate()}`;
    const locationClause = streetLabel ? ` on ${streetLabel}` : "";

    return {
      originalDate,
      actualDate,
      originalDateKey: formatDateKey(originalDate),
      actualDateKey: formatDateKey(actualDate),
      originalDayName,
      actualDayName,
      isDelayed: true,
      shiftDays: 1,
      holiday: matchingHoliday,
      holidayName: matchingHoliday.name,
      alertMessage: `${matchingHoliday.name} Delay: Your ${originalDayName} pickup${locationClause} moves to ${actualDayName}, ${formattedActualShort}.`,
    };
  }

  return {
    originalDate,
    actualDate: originalDate,
    originalDateKey: formatDateKey(originalDate),
    actualDateKey: formatDateKey(originalDate),
    originalDayName,
    actualDayName: originalDayName,
    isDelayed: false,
    shiftDays: 0,
  };
}

/**
 * Alias for getEffectivePickupDate.
 */
export const calculatePickupDate = getEffectivePickupDate;

/**
 * Generates upcoming pickup schedule calculations for N weeks starting from the week
 * of `referenceDate` (or the next upcoming pickup on/after `referenceDate`).
 *
 * @param dayOfWeekOrName Regular scheduled weekday (1..5 or "Monday".."Friday")
 * @param referenceDate Starting reference date (defaults to current date)
 * @param weeksCount Number of weekly pickups to generate (default: 4)
 * @param streetLabel Optional street label for human-readable delay messages
 */
export function getUpcomingPickups(
  dayOfWeekOrName: number | string,
  referenceDate: Date = new Date(),
  weeksCount = 4,
  streetLabel?: string
): PickupCalculationResult[] {
  const targetWeekday = parseDayNameToIndex(dayOfWeekOrName);
  const refNoon = normalizeToLocalNoon(referenceDate);
  const currentWeekMonday = getMondayOfWeek(refNoon);
  const currentWeekScheduled = addCalendarDays(
    currentWeekMonday,
    targetWeekday - 1
  );

  // Determine if this week's effective pickup is still today or in the future.
  const currentWeekResult = getEffectivePickupDate(
    currentWeekScheduled,
    streetLabel
  );

  const firstScheduledDate =
    currentWeekResult.actualDate.getTime() >= refNoon.getTime()
      ? currentWeekScheduled
      : addCalendarDays(currentWeekScheduled, 7);

  const results: PickupCalculationResult[] = [];
  for (let i = 0; i < weeksCount; i++) {
    const scheduled = addCalendarDays(firstScheduledDate, i * 7);
    results.push(getEffectivePickupDate(scheduled, streetLabel));
  }

  return results;
}
