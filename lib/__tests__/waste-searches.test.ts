import { describe, expect, it } from "vitest";
import { GET as sortGetHandler, POST as sortPostHandler } from "@/app/api/sort/route";
import { recordWasteSearch } from "@/lib/supabase";
import { NextRequest } from "next/server";

describe("Bin Sorter search logging & API", () => {
  it("processes GET /api/sort and returns valid classification", async () => {
    const req = new NextRequest("http://localhost/api/sort?q=greasy%20pizza%20box");
    const res = await sortGetHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.verdict).toBeDefined();
    expect(json.verdict.destination).toBe("green");
  });

  it("processes POST /api/sort and returns valid classification", async () => {
    const req = new NextRequest("http://localhost/api/sort", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: "batteries" }),
    });
    const res = await sortPostHandler(req);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.verdict).toBeDefined();
    expect(json.verdict.destination).toBe("dropoff");
  });

  it("handles empty or whitespace queries safely in recordWasteSearch", async () => {
    await expect(recordWasteSearch({ query: "" })).resolves.not.toThrow();
    await expect(recordWasteSearch({ query: "   " })).resolves.not.toThrow();
  });
});
