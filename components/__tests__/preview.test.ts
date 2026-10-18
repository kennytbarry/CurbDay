import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";
import BinCartStack from "@/components/BinCartStack";
import CalendarDownloadButton from "@/components/CalendarDownloadButton";
import CurbDayApp from "@/components/CurbDayApp";
import { DEMO_NOW, DEMO_PROFILES } from "@/lib/demo-profiles";

describe("CurbDay interactive preview", () => {
  it("renders the CurbDay cursive San Diego logo, empty search bar, stylized trash truck artwork, and instruction without hardcoded schedule cards on initial load", async () => {
    const pageElement = await HomePage({});
    const html = renderToStaticMarkup(pageElement);

    expect(html).toContain("CurbDay");
    expect(html).toContain("font-cursive");
    expect(html).toContain("San Diego");
    expect(html).toContain('value=""');
    expect(html).not.toContain('placeholder="Enter City of San Diego street address…"');
    expect(html).toContain('aria-expanded="false"');
    expect(html).not.toContain('id="esd-address-listbox"');
    expect(html).toContain(
      'aria-label="Stylized curbside collection truck illustration"'
    );
    expect(html).toContain(
      "Enter City of San Diego street address to view pickup and street sweeping schedule"
    );

    // Initial page load only shows address entry modal; tabs and bin sorter only appear after address entry
    expect(html).not.toContain("Curbside &amp; Sorter");
    expect(html).not.toContain("Hazardous &amp; Bulky");
    expect(html).not.toContain('placeholder="e.g., foil with melted cheese"');
    expect(html).not.toContain("llms.txt");
    expect(html).not.toContain("LLM Guide");

    // No hardcoded dates or schedule cards on initial page load before an address is selected
    expect(html).not.toContain("Saturday morning, Nov 28");
    expect(html).not.toContain("Next 3 Weeks");
    expect(html).not.toContain("Add to Calendar");
    expect(html).not.toContain("7445 Jackson Dr");
    expect(html).not.toContain("7372 Jackson Dr");
  });

  it("shows a parked state when recycling is inactive without a next date", () => {
    const html = renderToStaticMarkup(
      createElement(BinCartStack, { recyclingActive: false })
    );

    expect(html).toContain('aria-label="Recycling stays in, Skipped this week"');
    expect(html).not.toContain("Stays In");
    expect(html).toContain("border-dashed");
    expect(html).not.toContain("undefined");
  });

  it("contains no passive preview disclaimers or disabled controls", async () => {
    const pageElement = await HomePage({});
    const html = renderToStaticMarkup(pageElement);

    expect(html).not.toMatch(/coming soon/i);
    expect(html).not.toMatch(/design preview/i);
    expect(html).not.toMatch(/sample schedule/i);
    expect(html).not.toMatch(/disabled=""/);
  });

  it("renders the pickup schedule, parked Blue Cart, and 3-week timeline once an address is selected", () => {
    const html = renderToStaticMarkup(
      createElement(CurbDayApp, {
        profiles: DEMO_PROFILES,
        now: DEMO_NOW,
        initialProfileId: "north-park",
      })
    );

    expect(html).toContain("Schedule for");
    expect(html).toContain("3825 Ray St");
    expect(html).not.toContain('placeholder="Enter City of San Diego street address…"');
    expect(html).toContain("Curbside &amp; Sorter");
    expect(html).toContain("Hazardous &amp; Bulky");
    expect(html).toContain('placeholder="e.g., foil with melted cheese"');
    expect(html).toContain("Recycling stays in this week");
    expect(html).not.toContain("Saturday morning");
    expect(html).toContain("+1 day · Thanksgiving");
    expect(html).not.toContain("THURSDAY NIGHT");
    expect(html).toContain("Share");
    expect(html).toContain("Calendar");
    expect(html).toContain("Reminders");
    expect(html).toContain("Sat 11/28/2026");
    expect(html).toContain("Fri 12/04/2026");
    expect(html).toContain("bin-badge-recycling-inactive");
    expect(html).not.toContain("Next 3 Weeks");
  });

  it.each([true, false])(
    "renders physical cart stack state with unified container and distinct symbol colors alongside each cart when active=%s",
    (active) => {
      const html = renderToStaticMarkup(
        createElement(BinCartStack, {
          trashDate: "Fri 10/23/2026",
          organicsDate: "Fri 10/23/2026",
          recyclingDate: active ? "Fri 10/23/2026" : "Fri 10/30/2026",
          recyclingActive: active,
          nextRecyclingDate: "Fri 10/30/2026",
        })
      );

      expect(html).toContain('aria-label="Carts"');
      expect(html).toContain("Trash");
      expect(html).toContain("Organics");
      expect(html).toContain("Recycling");
      expect(html).not.toContain("Black Cart");
      expect(html).not.toContain("Green Cart");
      expect(html).not.toContain("Blue Cart");
      expect(html).not.toContain(">PICKUP<");
      expect(html).toContain("Fri 10/23/2026");
      if (active) {
        expect(html).toContain("bg-blue-600");
        expect(html).not.toContain("bin-badge-recycling-inactive");
      } else {
        expect(html).toContain("bin-badge-recycling-inactive");
        expect(html).not.toContain("Stays In");
        expect(html).toContain("border-dashed");
        expect(html).toContain("lucide-recycle");
        expect(html).not.toContain("lucide-circle-parking");
        expect(html).toContain("Fri 10/30/2026");
      }
    }
  );

  it("renders a calendar download link when given an endpoint", () => {
    const html = renderToStaticMarkup(
      createElement(CalendarDownloadButton, { href: "/sample-calendar.ics" })
    );

    expect(html).toContain('href="/sample-calendar.ics"');
    expect(html).toContain('download=""');
    expect(html).not.toContain("disabled");
  });
});
