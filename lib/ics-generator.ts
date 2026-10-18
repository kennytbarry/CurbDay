/**
 * Minimal RFC 5545 iCalendar builder (PRD FR-103).
 *
 * Emits one all-day VEVENT per collection (rather than an RRULE) so that each
 * holiday-shifted date is baked in, with a 7:00 PM reminder the evening before.
 */
import { addCalendarDays, formatDateKey } from "@/lib/holidays";
import type { CollectionEvent } from "@/lib/schedule";

export interface CalendarOptions {
  address: string;
  slug: string;
  events: CollectionEvent[];
  /** Timestamp for DTSTAMP; injectable for deterministic tests. */
  now?: Date;
}

function toIcsDate(date: Date): string {
  return formatDateKey(date).replace(/-/g, "");
}

function toIcsTimestamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

/** RFC 5545 §3.3.11 TEXT escaping. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** RFC 5545 §3.1 line folding at 75 octets (content is ASCII). */
function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [line.slice(0, 75)];
  for (let i = 75; i < line.length; i += 74) {
    parts.push(" " + line.slice(i, i + 74));
  }
  return parts.join("\r\n");
}

export function buildCollectionCalendar({
  address,
  slug,
  events,
  now = new Date(),
}: CalendarOptions): string {
  const stamp = toIcsTimestamp(now);
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CurbDay//San Diego Collection Schedule//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(`CurbDay - ${address}`)}`,
  ];

  for (const { pickup, recycling } of events) {
    const carts = recycling
      ? "Trash + Organics + Recycling"
      : "Trash + Organics";
    const summary = pickup.isDelayed && pickup.holidayName
      ? `${carts} - ${pickup.holidayName} delay`
      : carts;
    const description = pickup.isDelayed
      ? `Moved from ${pickup.originalDayName} to ${pickup.actualDayName} for ${pickup.holidayName}. Put carts out the night before.`
      : "Put carts out the night before.";

    lines.push(
      "BEGIN:VEVENT",
      `UID:${pickup.originalDateKey}-${slug}@curbday`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${toIcsDate(pickup.actualDate)}`,
      `DTEND;VALUE=DATE:${toIcsDate(addCalendarDays(pickup.actualDate, 1))}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      `LOCATION:${escapeIcsText(address)}`,
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      // All-day events start at local midnight; -5h = 7:00 PM the evening before.
      "TRIGGER:-PT5H",
      `DESCRIPTION:${escapeIcsText(`Tonight: ${carts}`)}`,
      "END:VALARM",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}

export interface SweepingCalendarOptions {
  address: string;
  slug: string;
  street: string;
  blockRange: string;
  isPosted: boolean;
  timeWindow: string | null;
  sides: string;
  frequency: string;
  dates: Date[];
  now?: Date;
}

export function buildStreetSweepingCalendar({
  address,
  slug,
  street,
  blockRange,
  isPosted,
  timeWindow,
  sides,
  frequency,
  dates,
  now = new Date(),
}: SweepingCalendarOptions): string {
  const stamp = toIcsTimestamp(now);
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//CurbDay//San Diego Street Sweeping//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcsText(`Move Your Car - Street Sweeping (${street})`)}`,
  ];

  for (const date of dates) {
    const dateStr = toIcsDate(date);
    const summary = `Street Sweeping - Move Your Car (${sides})`;
    const description = `City of San Diego street sweeping for ${street} (${blockRange}). ${
      isPosted
        ? `Enforced hours: ${timeWindow || "Posted Times"}. Vehicles parked during sweeping hours are subject to City citation. `
        : "Unsigned residential sweeping. Keeping the curb clear allows sweepers to reach the gutter. "
    }Cadence: ${frequency}.`;

    lines.push(
      "BEGIN:VEVENT",
      `UID:${dateStr}-sweeping-${slug}@curbday`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${dateStr}`,
      `DTEND;VALUE=DATE:${toIcsDate(addCalendarDays(date, 1))}`,
      `SUMMARY:${escapeIcsText(summary)}`,
      `DESCRIPTION:${escapeIcsText(description)}`,
      `LOCATION:${escapeIcsText(address)}`,
      "TRANSP:TRANSPARENT",
      "BEGIN:VALARM",
      "ACTION:DISPLAY",
      "TRIGGER:-PT5H",
      `DESCRIPTION:${escapeIcsText(
        `Tonight: Move your car for street sweeping tomorrow (${sides})!`
      )}`,
      "END:VALARM",
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.map(foldLine).join("\r\n") + "\r\n";
}
