import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";
import { config, middleware } from "@/middleware";

afterEach(() => vi.restoreAllMocks());

describe("bot middleware", () => {
  it.each(["GET", "POST", "HEAD"])("denies blocked bots for %s requests", async (method) => {
    const log = vi.spyOn(console, "info").mockImplementation(() => {});
    const request = new NextRequest("https://curbday-sd.vercel.app/api/sort?q=private-query", {
      method,
      headers: { "user-agent": "sqlmap/1.9" },
    });

    const response = middleware(request);

    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Forbidden" });
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("x-robots-tag")).toBe("noindex");
    expect(response.headers.get("x-curbday-bot-action")).toBe("deny");
    expect(response.headers.has("x-middleware-next")).toBe(false);
    expect(log).toHaveBeenCalledExactlyOnceWith(
      JSON.stringify({ event: "bot_blocked", bot: "sqlmap", action: "deny" })
    );
  });

  it.each([undefined, "Mozilla/5.0", "Googlebot/2.1", "GPTBot/1.0"])(
    "passes through non-denied traffic without logs: %s",
    (userAgent) => {
      const log = vi.spyOn(console, "info").mockImplementation(() => {});
      const response = middleware(
        new NextRequest("https://curbday-sd.vercel.app/", {
          headers: userAgent ? { "user-agent": userAgent } : {},
        })
      );

      expect(response.headers.get("x-middleware-next")).toBe("1");
      expect(response.headers.has("x-curbday-bot-action")).toBe(false);
      expect(response.headers.has("cache-control")).toBe(false);
      expect(log).not.toHaveBeenCalled();
    }
  );
});

describe("middleware matcher", () => {
  it.each([
    "/",
    "/about",
    "/api/geocode",
    "/api/schedule",
    "/api/sort",
    "/api/special-events",
    "/api/usage",
    "/api/example.json",
    "/_next/static-other",
    "/_vercel-other",
    "/icons-other",
    "/robots.txt/other",
  ])("filters application route %s", (path) => {
    expect(
      unstable_doesMiddlewareMatch({ config, url: `https://curbday-sd.vercel.app${path}` })
    ).toBe(true);
  });

  it.each([
    "/_next/static/chunks/app.js",
    "/_next/image?url=%2Ficons%2Ficon.png&w=64&q=75",
    "/_vercel/insights/script.js",
    "/_vercel/insights/view",
    "/_vercel/speed-insights/script.js",
    "/icons/icon.svg",
    "/favicon.ico",
    "/robots.txt",
    "/sitemap.xml",
    "/manifest.webmanifest",
    "/opengraph-image",
    "/llms.txt",
    "/llms-full.txt",
  ])("skips assets and platform/discovery endpoints: %s", (path) => {
    expect(
      unstable_doesMiddlewareMatch({ config, url: `https://curbday-sd.vercel.app${path}` })
    ).toBe(false);
  });
});
