import { describe, expect, it } from "vitest";
import { POST as subscribeHandler } from "@/app/api/subscribe/route";
import { GET as unsubscribeGetHandler, POST as unsubscribePostHandler } from "@/app/api/unsubscribe/route";
import { NextRequest } from "next/server";
import { extractStreetAddress } from "@/lib/esd";

describe("Email subscriptions & Unsubscribe API", () => {
  it("rejects invalid email formats with 400 Bad Request", async () => {
    const req = new NextRequest("http://localhost/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "not-an-email",
        address: "3825 Ray St",
        trashDay: 4,
        recyclingCadence: "alternate_b",
      }),
    });

    const res = await subscribeHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("valid email");
  });

  it("rejects missing address with 400 Bad Request", async () => {
    const req = new NextRequest("http://localhost/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "resident@sandiego.gov",
        trashDay: 4,
        recyclingCadence: "alternate_b",
      }),
    });

    const res = await subscribeHandler(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Address is required");
  });

  it("handles valid subscription gracefully when Supabase is in mock mode", async () => {
    const req = new NextRequest("http://localhost/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "resident@sandiego.gov",
        address: "3825 Ray St, San Diego, CA 92104",
        trashDay: 4,
        recyclingCadence: "alternate_b",
      }),
    });

    const res = await subscribeHandler(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.ok).toBe(true);
  });

  it("handles valid street sweeping subscription gracefully", async () => {
    const req = new NextRequest("http://localhost/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "resident@sandiego.gov",
        address: "6906 Mewall Dr, San Diego, CA 92119",
        mode: "street_sweeping",
        sweeping: {
          street: "MEWALL DR",
          blockRange: "6800–6989 block",
          day: "Wednesday",
          frequency: "Even Months · 3rd Wednesday",
          timeWindow: "7:00 AM - 11:00 AM",
          sides: "Both Sides of Street",
          scheduleRaw: "Not Posted, Both Sides Even Month 3rd Wed",
        },
      }),
    });

    const res = await subscribeHandler(req);
    // In local test without DB table, may return 200 (mock) or 503 (table missing) or 200
    expect([200, 503]).toContain(res.status);
    const json = await res.json();
    if (res.status === 200) {
      expect(json.ok).toBe(true);
    } else {
      expect(json.migrationRequired).toBe(true);
    }
  });

  it("rejects unsubscribe GET requests missing a token", async () => {
    const req = new NextRequest("http://localhost/api/unsubscribe");
    const res = await unsubscribeGetHandler(req);
    expect(res.status).toBe(400);
  });

  it("rejects unsubscribe POST requests missing a token", async () => {
    const req = new NextRequest("http://localhost/api/unsubscribe", {
      method: "POST",
    });
    const res = await unsubscribePostHandler(req);
    expect(res.status).toBe(400);
  });

  it("extractStreetAddress strips city, state, and zip from full address strings", () => {
    expect(extractStreetAddress("6906 Mewall Dr, San Diego, CA 92119")).toBe("6906 Mewall Dr");
    expect(extractStreetAddress("3825 Ray St, San Diego, CA 92104")).toBe("3825 Ray St");
    expect(extractStreetAddress("4120 44th St")).toBe("4120 44th St");
  });
});
