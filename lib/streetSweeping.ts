/**
 * City of San Diego Street Sweeping Schedule Parser & GeoSweep Client.
 *
 * Official GIS Feature Service:
 * https://webmaps.sandiego.gov/arcgis/rest/services/GeoSweep/GeoSweep_Dynamic/MapServer/13
 */

export interface StreetSweepingRecord {
  street: string;
  blockRange: string;
  zip: number;
  isPosted: boolean;
  postedRaw: string;
  scheduleRaw: string;
  schedule2Raw?: string;
  shift: string;
  nextDate: string; // YYYY-MM-DD
  nextDateFormatted: string; // e.g. "Tuesday, Nov 24"
  daysUntil: number;
  timeWindow: string | null;
  sides: string;
  frequency: string;
  tip: string;
}

const DAY_NAMES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const DAY_MAP: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tues: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thur: 4,
  thurs: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

/**
 * Finds the Nth occurrence of a weekday in a given year and month (1-indexed).
 * nth: 1 (1st), 2 (2nd), 3 (3rd), 4 (4th), 5 (5th).
 */
function getNthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  nth: number
): Date | null {
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  const firstWeekday = firstDay.getUTCDay();
  let dayOffset = weekday - firstWeekday;
  if (dayOffset < 0) dayOffset += 7;

  const targetDay = 1 + dayOffset + (nth - 1) * 7;
  const targetDate = new Date(Date.UTC(year, month - 1, targetDay));

  // Check if month overflowed
  if (targetDate.getUTCMonth() !== month - 1) {
    return null;
  }
  return targetDate;
}

/**
 * Parses City of San Diego schedule string and calculates the next sweeping date.
 */
export function calculateNextSweepingDate(
  scheduleText: string,
  refDate = new Date()
): {
  nextDate: Date;
  frequency: string;
  sides: string;
  timeWindow: string | null;
} {
  const text = scheduleText.trim();
  const refYear = refDate.getUTCFullYear();
  const refMonth = refDate.getUTCMonth() + 1; // 1-12
  const refDay = refDate.getUTCDate();

  // Extract time window if present e.g. "(8am - 11am)" or "(10am-1pm)"
  const timeMatch = text.match(/\(([0-9apmAPM\s\-:]+)\)/);
  const timeWindow = timeMatch ? timeMatch[1].trim() : null;

  // Extract side description
  let sides = "Both Sides of Street";
  if (/\bBoth\s*sides\b/i.test(text)) {
    sides = "Both Sides of Street";
  } else if (/\bES\b/i.test(text) && /\bWS\b/i.test(text)) {
    sides = "Alternate Sides";
  } else if (/\bSS\b/i.test(text) && /\bNS\b/i.test(text)) {
    sides = "Alternate Sides";
  } else if (/\bES\b/i.test(text)) {
    sides = "East Side Only";
  } else if (/\bWS\b/i.test(text)) {
    sides = "West Side Only";
  } else if (/\bNS\b/i.test(text)) {
    sides = "North Side Only";
  } else if (/\bSS\b/i.test(text)) {
    sides = "South Side Only";
  }

  // Check month parity: "Even Month", "Odd Month", or Every Month
  const isEvenMonthOnly = /\bEven\s+Month\b/i.test(text);
  const isOddMonthOnly = /\bOdd\s+Month\b/i.test(text);

  // Check ordinal: 1st, 2nd, 3rd, 4th
  const ordinals: number[] = [];
  if (/\b1st\b/i.test(text)) ordinals.push(1);
  if (/\b2nd\b/i.test(text)) ordinals.push(2);
  if (/\b3rd\b/i.test(text)) ordinals.push(3);
  if (/\b4th\b/i.test(text)) ordinals.push(4);

  // Check weekdays
  const matchedDays: number[] = [];
  for (const [key, val] of Object.entries(DAY_MAP)) {
    const rx = new RegExp(`\\b${key}\\b`, "i");
    if (rx.test(text) && !matchedDays.includes(val)) {
      matchedDays.push(val);
    }
  }

  // Frequency string
  let frequency = "Scheduled Monthly";
  if (isOddMonthOnly) {
    frequency = "Odd Months";
  } else if (isEvenMonthOnly) {
    frequency = "Even Months";
  } else {
    frequency = "Monthly";
  }
  if (ordinals.length > 0 && matchedDays.length > 0) {
    const ordStr = ordinals.map((o) => ["1st", "2nd", "3rd", "4th"][o - 1]).join(" & ");
    const dayStr = matchedDays.map((d) => DAY_NAMES[d]).join(" / ");
    frequency += ` · ${ordStr} ${dayStr}`;
  } else if (matchedDays.length > 0) {
    const dayStr = matchedDays.map((d) => DAY_NAMES[d]).join(" & ");
    frequency = `Weekly · ${dayStr}`;
  }

  // Iterate up to 12 months forward to find the next valid occurrence after refDate
  const todayUtc = new Date(Date.UTC(refYear, refMonth - 1, refDay));

  for (let mOffset = 0; mOffset < 12; mOffset++) {
    let checkMonth = refMonth + mOffset;
    let checkYear = refYear;
    while (checkMonth > 12) {
      checkMonth -= 12;
      checkYear += 1;
    }

    if (isEvenMonthOnly && checkMonth % 2 !== 0) continue;
    if (isOddMonthOnly && checkMonth % 2 === 0) continue;

    // Check all ordinal and day combinations
    const candidateDates: Date[] = [];

    if (ordinals.length > 0 && matchedDays.length > 0) {
      for (const ord of ordinals) {
        for (const wd of matchedDays) {
          const d = getNthWeekdayOfMonth(checkYear, checkMonth, wd, ord);
          if (d && d >= todayUtc) {
            candidateDates.push(d);
          }
        }
      }
    } else if (matchedDays.length > 0) {
      // Weekly: scan all days in the month
      const daysInMonth = new Date(Date.UTC(checkYear, checkMonth, 0)).getUTCDate();
      for (let day = 1; day <= daysInMonth; day++) {
        const d = new Date(Date.UTC(checkYear, checkMonth - 1, day));
        if (matchedDays.includes(d.getUTCDay()) && d >= todayUtc) {
          candidateDates.push(d);
        }
      }
    }

    if (candidateDates.length > 0) {
      candidateDates.sort((a, b) => a.getTime() - b.getTime());
      return {
        nextDate: candidateDates[0],
        frequency,
        sides,
        timeWindow,
      };
    }
  }

  // Default fallback if parsing fails
  const fallbackDate = new Date(Date.UTC(refYear, refMonth - 1, refDay + 14));
  return {
    nextDate: fallbackDate,
    frequency: text,
    sides,
    timeWindow,
  };
}

/**
 * Calculates a sequence of upcoming street sweeping dates starting from startDate.
 */
export function getSweepingDates(
  scheduleText: string,
  startDate = new Date(),
  count = 12
): Date[] {
  const dates: Date[] = [];
  let currentRef = new Date(startDate);
  for (let i = 0; i < count; i++) {
    const res = calculateNextSweepingDate(scheduleText, currentRef);
    if (!res || !res.nextDate) break;
    if (
      dates.length > 0 &&
      res.nextDate.getTime() <= dates[dates.length - 1].getTime()
    ) {
      break;
    }
    dates.push(res.nextDate);
    currentRef = new Date(
      Date.UTC(
        res.nextDate.getUTCFullYear(),
        res.nextDate.getUTCMonth(),
        res.nextDate.getUTCDate() + 1
      )
    );
  }
  return dates;
}

/**
 * Queries the City of San Diego GeoSweep Feature Layer for an address.
 */
export async function queryStreetSweeping(
  address: string,
  now = new Date()
): Promise<StreetSweepingRecord | null> {
  const trimmed = address.trim();
  if (!trimmed) return null;

  try {
    // 1. Geocode the address to coordinates using ArcGIS World Geocoder
    const geoUrl = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?SingleLine=${encodeURIComponent(
      trimmed
    )}&outFields=StAddr,City,Postal&maxLocations=1&f=pjson`;

    const geoRes = await fetch(geoUrl, {
      signal: AbortSignal.timeout(4000),
    });
    if (!geoRes.ok) return null;

    const geoData = (await geoRes.json()) as {
      candidates?: Array<{
        location?: { x: number; y: number };
        attributes?: { StAddr?: string; Postal?: string };
      }>;
    };

    const candidate = geoData.candidates?.[0];
    const pt = candidate?.location;
    if (!pt) return null;

    // 2. Query GeoSweep Layer 13 around the point with a 35-meter radius
    const sweepUrl = `https://webmaps.sandiego.gov/arcgis/rest/services/GeoSweep/GeoSweep_Dynamic/MapServer/13/query?geometry=${pt.x},${pt.y}&geometryType=esriGeometryPoint&inSR=4326&spatialRel=esriSpatialRelIntersects&distance=35&units=esriSRUnit_Meter&outFields=RD20FULL,LOW_ADDR,HIGH_ADDR,ZIP,POSTED,SCHEDULE,SCHEDULE2,SHIFT&f=json&returnGeometry=false`;

    const sweepRes = await fetch(sweepUrl, {
      signal: AbortSignal.timeout(5000),
    });
    if (!sweepRes.ok) return null;

    const sweepData = (await sweepRes.json()) as {
      features?: Array<{
        attributes?: {
          RD20FULL?: string;
          LOW_ADDR?: number;
          HIGH_ADDR?: number;
          ZIP?: number;
          POSTED?: string;
          SCHEDULE?: string;
          SCHEDULE2?: string;
          SHIFT?: string;
        };
      }>;
    };

    const feature = sweepData.features?.[0]?.attributes;
    if (!feature || !feature.SCHEDULE || !feature.SCHEDULE.trim()) {
      return null;
    }

    const streetName = feature.RD20FULL || "Your Street";
    const low = feature.LOW_ADDR ?? 0;
    const high = feature.HIGH_ADDR ?? 0;
    const blockRange = low && high ? `${low}–${high} block` : "residential block";
    const isPosted = feature.POSTED === "P";

    const { nextDate, frequency, sides, timeWindow } =
      calculateNextSweepingDate(feature.SCHEDULE, now);

    const year = nextDate.getUTCFullYear();
    const month = String(nextDate.getUTCMonth() + 1).padStart(2, "0");
    const day = String(nextDate.getUTCDate()).padStart(2, "0");
    const nextDateIso = `${year}-${month}-${day}`;

    // Calculate diff in calendar days
    const todayMidnight = new Date(
      Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())
    );
    const targetMidnight = new Date(Date.UTC(year, nextDate.getUTCMonth(), nextDate.getUTCDate()));
    const diffMs = targetMidnight.getTime() - todayMidnight.getTime();
    const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));

    const dayName = DAY_NAMES[nextDate.getUTCDay()];
    const monthName = MONTH_NAMES[nextDate.getUTCMonth()].slice(0, 3);
    const nextDateFormatted = `${dayName}, ${monthName} ${nextDate.getUTCDate()}`;

    const tip = isPosted
      ? `Vehicles parked at the curb during posted hours (${timeWindow || "posted times"}) are subject to City citation.`
      : "Unsigned residential sweeping. No parking citations are issued, but keeping the curb clear allows sweepers to reach the gutter.";

    return {
      street: streetName,
      blockRange,
      zip: feature.ZIP ?? 0,
      isPosted,
      postedRaw: feature.POSTED ?? "NP",
      scheduleRaw: feature.SCHEDULE,
      schedule2Raw: feature.SCHEDULE2?.trim() || undefined,
      shift: feature.SHIFT ?? "D",
      nextDate: nextDateIso,
      nextDateFormatted,
      daysUntil,
      timeWindow,
      sides,
      frequency,
      tip,
    };
  } catch (err) {
    console.error("GeoSweep query error:", err);
    return null;
  }
}
