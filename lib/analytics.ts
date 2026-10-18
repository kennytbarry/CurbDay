import { track } from "@vercel/analytics";

/**
 * Safe client-side analytics helper using @vercel/analytics.
 * Automatically no-ops when executed server-side, in test environments, or offline.
 */

export function trackAddressSearched(
  address: string,
  source: "autocomplete" | "submit" | "url" = "submit"
): void {
  try {
    if (typeof window !== "undefined" && address.trim()) {
      track("address_searched", {
        address: address.trim(),
        source,
      });
    }
  } catch {
    // Fail-safe analytics no-op
  }
}

export function trackCalendarExported(
  format:
    | "ics"
    | "webcal_apple"
    | "webcal_google"
    | "ics_download"
    | "webcal_apple_sweeping"
    | "webcal_google_sweeping"
    | "ics_download_sweeping" = "ics",
  address?: string
): void {
  try {
    if (typeof window !== "undefined") {
      track("calendar_exported", {
        format,
        ...(address ? { address: address.trim() } : {}),
      });
    }
  } catch {
    // Fail-safe analytics no-op
  }
}

export function trackWasteAdvisorQueried(
  query: string,
  destination?: string
): void {
  try {
    if (typeof window !== "undefined" && query.trim()) {
      track("waste_advisor_queried", {
        query: query.trim(),
        ...(destination ? { destination } : {}),
      });
    }
  } catch {
    // Fail-safe analytics no-op
  }
}

export function trackHhwEventSaved(
  eventId: string,
  venueName: string
): void {
  try {
    if (typeof window !== "undefined") {
      track("hhw_event_saved", {
        eventId,
        venueName,
      });
    }
  } catch {
    // Fail-safe analytics no-op
  }
}
