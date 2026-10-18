import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import SpecialEventsCalendar from "@/components/SpecialEventsCalendar";
import {
  FALLBACK_EVENTS_DATA,
  FIVE_ACCEPTED_POPUP_ITEMS,
  POPUP_PROHIBITED_ITEMS,
  generateIcsForSpecialEvent,
} from "@/lib/specialEvents";
import { getSpecialEventsData } from "@/lib/specialEventsScraper";

describe("San Diego Special Hazardous & Bulky Waste Events", () => {
  it("includes the 5 accepted pop-up categories and prohibited categories in fallback seed", () => {
    expect(FIVE_ACCEPTED_POPUP_ITEMS).toHaveLength(5);
    expect(FIVE_ACCEPTED_POPUP_ITEMS).toContain(
      "Household Batteries (AA, AAA, 9V, button cell, lithium-ion)"
    );
    expect(FIVE_ACCEPTED_POPUP_ITEMS).toContain("Used Motor Oil Filters");

    expect(POPUP_PROHIBITED_ITEMS).toContain(
      "No Paint, Stains, or Solvents"
    );
  });

  it("provides verified 2026–2027 Saturday pop-up events and permanent facilities", () => {
    expect(FALLBACK_EVENTS_DATA.upcomingEvents.length).toBeGreaterThanOrEqual(4);
    const balboa = FALLBACK_EVENTS_DATA.upcomingEvents[0];
    expect(balboa.venueName).toContain("Balboa Park");
    expect(balboa.startTime).toBe("9:00 AM");
    expect(balboa.endTime).toBe("1:00 PM");

    expect(FALLBACK_EVENTS_DATA.permanentFacilities).toHaveLength(2);
    const miramarHhw = FALLBACK_EVENTS_DATA.permanentFacilities[0];
    expect(miramarHhw.name).toContain("Miramar Hazardous Waste");
    expect(miramarHhw.appointmentRequired).toBe(true);
    expect(miramarHhw.phone).toBe("858-694-7000");

    const recyclingCenter = FALLBACK_EVENTS_DATA.permanentFacilities[1];
    expect(recyclingCenter.name).toContain("Miramar Recycling Center");
    expect(recyclingCenter.schedule).toContain("7:00 AM – 4:00 PM");
  });

  it("generates a valid RFC 5545 single-event ICS file for Saturday pop-ups", () => {
    const event = FALLBACK_EVENTS_DATA.upcomingEvents[0];
    const ics = generateIcsForSpecialEvent(event);

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("BEGIN:VEVENT");
    expect(ics).toContain(`UID:${event.id}@curbday-sd.vercel.app`);
    expect(ics).toContain("DTSTART:20261024T090000");
    expect(ics).toContain("DTEND:20261024T130000");
    expect(ics).toContain(`SUMMARY:San Diego Drop-Off: ${event.venueName}`);
    expect(ics).toContain(event.streetAddress);
    expect(ics).toContain("END:VEVENT");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("retrieves special events payload via getSpecialEventsData()", async () => {
    const data = await getSpecialEventsData();
    expect(data.upcomingEvents.length).toBeGreaterThan(0);
    expect(data.permanentFacilities).toHaveLength(2);
    expect(data.source).toMatch(/live|fallback/);
  });

  it("renders unified Saturday Pop-Up section with simplified headings and carousel", () => {
    const html = renderToStaticMarkup(createElement(SpecialEventsCalendar));
    // Simplified headings
    expect(html).toContain("One-Day Collection Events");
    expect(html).toContain("Accepted");
    expect(html).toContain("Not Accepted");
    expect(html).toContain("Upcoming Events");
    expect(html).toContain("Household Batteries:");
    expect(html).not.toContain("(Swipe or use arrows)");
    expect(html).not.toContain("Saturday pop-ups &amp; permanent Miramar");
    expect(html).not.toContain("Synced with sandiego.gov");
    // Events carousel structure
    expect(html).toContain('aria-label="Upcoming pop-up events carousel"');
    expect(html).toContain("data-event-card");
    expect(html).toContain("Previous pop-up event");
    expect(html).toContain("Next pop-up event");
    // No redundant directions button
    expect(html).not.toContain(">Directions<");

    // Main title: Free Hazardous & Bulky Waste Dropoff (no "City Hazardous & Bulky Services" eyebrow)
    expect(html).toContain("Free Hazardous &amp; Bulky Waste Dropoff");
    expect(html).not.toContain("City Hazardous &amp; Bulky Services");
    expect(html).not.toContain("Hazardous &amp; Bulky Waste Events");

    // Section 1: One-Day Collection Events
    expect(html).toContain("One-Day Collection Events");

    // Section 2: Miramar Landfill
    expect(html).toContain("Miramar Landfill");
    expect(html).not.toContain("Permanent Drop-Off Facilities");
    expect(html).not.toContain("Free for City residents");
    expect(html).toContain("Miramar Hazardous Waste Transfer Facility");
    expect(html).toContain("Miramar Recycling Center &amp; Greenery");
    expect(html).toContain("No Appointment Needed");
    expect(html).not.toContain("Free Mattress Drop-Off");

    // Clean requirement pill: Bold Coral for Appointment Required
    expect(html).toContain("Appointment Required");
    expect(html).not.toContain("Free for Residents");
    expect(html).toContain("bg-flip-coralDark text-white");

    // Neutral mattress box styling (no emerald highlight on heading)
    expect(html).toContain("Free Mattress &amp; Box Spring Drop-Off");
    expect(html).not.toContain('text-emerald-300">Free Mattress');
  });
});
