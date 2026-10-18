/**
 * Self-healing weekly scraper & structured JSON extractor for
 * City of San Diego Hazardous & Universal Waste Events.
 *
 * Implements 7-day ISR caching (revalidate: 604800) to ensure at most
 * 1 scrape + Gemini call per week across all users.
 */

import {
  FALLBACK_EVENTS_DATA,
  FIVE_ACCEPTED_POPUP_ITEMS,
  POPUP_PROHIBITED_ITEMS,
  type SpecialEvent,
  type SpecialEventsData,
} from "./specialEvents";

const SCRAPE_REVALIDATE_SECONDS = 604800; // 7 days

const ONE_DAY_EVENTS_URL =
  "https://www.sandiego.gov/environmental-services/ep/events/one-day";
const HAZARDOUS_FACILITY_URL =
  "https://www.sandiego.gov/environmental-services/ep/hazardous";

function getTodayPacificDateString(): string {
  const now = new Date();
  const pacificFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Los_Angeles",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = pacificFormatter.formatToParts(now);
  const year = parts.find((p) => p.type === "year")?.value ?? "2026";
  const month = parts.find((p) => p.type === "month")?.value ?? "10";
  const day = parts.find((p) => p.type === "day")?.value ?? "18";
  return `${year}-${month}-${day}`;
}

function stripHtml(html: string): string {
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
    .replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, "")
    .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, "")
    .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, "")
    .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 15000);
}

async function fetchWithTimeout(url: string, timeoutMs = 6000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      next: { revalidate: SCRAPE_REVALIDATE_SECONDS },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function extractEventsWithGemini(
  text: string,
  apiKey: string
): Promise<SpecialEvent[] | null> {
  const model = "gemini-3.8-flash";
  const prompt = `You are extracting upcoming City of San Diego One-Day Household Hazardous / Universal Waste pop-up collection events from official City ESD text.
Return ONLY a JSON array of events with the following fields:
[
  {
    "id": "slug-id",
    "date": "YYYY-MM-DD",
    "displayDate": "Saturday, Month Day, Year",
    "startTime": "9:00 AM",
    "endTime": "1:00 PM",
    "venueName": "Venue / Park / School Name",
    "streetAddress": "Street address, City, Zip",
    "region": "Region (e.g. Central / Balboa Park, South Bay / Otay Mesa, North City)",
    "appointmentRequired": false
  }
]
If no events are listed, return [].`;

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        apiKey
      )}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: `${prompt}\n\nWebpage text:\n${text}` }],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.1,
          },
        }),
        signal: AbortSignal.timeout(8000),
      }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const raw = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!raw) return null;

    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;

    return parsed.map((e: Partial<SpecialEvent>, idx: number) => ({
      id: e.id || `event-${idx}`,
      date: e.date || "2026-10-24",
      displayDate: e.displayDate || e.date || "Saturday",
      startTime: e.startTime || "9:00 AM",
      endTime: e.endTime || "1:00 PM",
      venueName: e.venueName || "City of San Diego Pop-Up",
      streetAddress: e.streetAddress || "San Diego, CA",
      region: e.region || "San Diego",
      acceptedItems: [...FIVE_ACCEPTED_POPUP_ITEMS],
      prohibitedItems: [...POPUP_PROHIBITED_ITEMS],
      appointmentRequired: false,
    }));
  } catch {
    return null;
  }
}

let memoryCache: { data: SpecialEventsData; expiresAt: number } | null = null;

/**
 * Main server function to retrieve upcoming Special Hazardous & Bulky Waste Events.
 * Pre-rendered on server for 0ms client loads with a 7-day memory + ISR cache.
 */
export async function getSpecialEventsData(): Promise<SpecialEventsData> {
  const now = Date.now();
  if (memoryCache && memoryCache.expiresAt > now) {
    return memoryCache.data;
  }

  const today = getTodayPacificDateString();
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const [oneDayHtml] = await Promise.all([
        fetchWithTimeout(ONE_DAY_EVENTS_URL),
        fetchWithTimeout(HAZARDOUS_FACILITY_URL),
      ]);
      if (oneDayHtml) {
        const text = stripHtml(oneDayHtml);
        if (text.length > 200) {
          const liveEvents = await extractEventsWithGemini(text, apiKey);
          if (liveEvents && liveEvents.length > 0) {
            const futureLiveEvents = liveEvents.filter((e) => e.date >= today);
            if (futureLiveEvents.length > 0) {
              const liveResult: SpecialEventsData = {
                upcomingEvents: futureLiveEvents,
                permanentFacilities: FALLBACK_EVENTS_DATA.permanentFacilities,
                lastSyncedAt: new Date().toISOString(),
                source: "live",
              };
              memoryCache = {
                data: liveResult,
                expiresAt: now + SCRAPE_REVALIDATE_SECONDS * 1000,
              };
              return liveResult;
            }
          }
        }
      }
    } catch {
      // Fall through to fallback seed
    }
  }

  // Gracefully return verified fallback seed, filtered to future events
  const futureFallbackEvents = FALLBACK_EVENTS_DATA.upcomingEvents.filter(
    (e) => e.date >= today
  );

  const fallbackResult: SpecialEventsData = {
    upcomingEvents:
      futureFallbackEvents.length > 0
        ? futureFallbackEvents
        : FALLBACK_EVENTS_DATA.upcomingEvents,
    permanentFacilities: FALLBACK_EVENTS_DATA.permanentFacilities,
    lastSyncedAt: FALLBACK_EVENTS_DATA.lastSyncedAt,
    source: "fallback",
  };
  memoryCache = {
    data: fallbackResult,
    expiresAt: now + SCRAPE_REVALIDATE_SECONDS * 1000,
  };
  return fallbackResult;
}
