import { describe, expect, it, beforeEach } from "vitest";
import {
  InMemoryRateLimiter,
  getClientIp,
  defaultRateLimiter,
} from "@/lib/rate-limiter";

describe("InMemoryRateLimiter", () => {
  let limiter: InMemoryRateLimiter;

  beforeEach(() => {
    limiter = new InMemoryRateLimiter({
      maxRequests: 3,
      windowMs: 1000,
      maxQueryLength: 50,
    });
    defaultRateLimiter.reset();
  });

  it("permits requests up to maxRequests within the window", () => {
    const res1 = limiter.check("1.2.3.4", "pizza box");
    expect(res1.success).toBe(true);
    expect(res1.remaining).toBe(2);

    const res2 = limiter.check("1.2.3.4", "plastic bottle");
    expect(res2.success).toBe(true);
    expect(res2.remaining).toBe(1);

    const res3 = limiter.check("1.2.3.4", "batteries");
    expect(res3.success).toBe(true);
    expect(res3.remaining).toBe(0);
  });

  it("rejects requests exceeding maxRequests with status 429", () => {
    limiter.check("1.2.3.4", "query 1");
    limiter.check("1.2.3.4", "query 2");
    limiter.check("1.2.3.4", "query 3");

    const blocked = limiter.check("1.2.3.4", "query 4");
    expect(blocked.success).toBe(false);
    expect(blocked.statusCode).toBe(429);
    expect(blocked.error).toContain("Too many requests");
    expect(blocked.remaining).toBe(0);
    expect(blocked.resetMs).toBeGreaterThan(0);
  });

  it("isolates rate limits between different IP addresses", () => {
    limiter.check("1.1.1.1", "q1");
    limiter.check("1.1.1.1", "q2");
    limiter.check("1.1.1.1", "q3");

    // IP 1 is blocked
    expect(limiter.check("1.1.1.1", "q4").success).toBe(false);

    // IP 2 is still allowed
    const otherIpRes = limiter.check("2.2.2.2", "q1");
    expect(otherIpRes.success).toBe(true);
    expect(otherIpRes.remaining).toBe(2);
  });

  it("rejects queries exceeding maxQueryLength with status 400", () => {
    const overlyLongQuery = "a".repeat(51);
    const res = limiter.check("1.2.3.4", overlyLongQuery);
    expect(res.success).toBe(false);
    expect(res.statusCode).toBe(400);
    expect(res.error).toContain("Query too long");
  });

  it("extracts client IP correctly from headers", () => {
    const headers1 = new Headers({ "x-forwarded-for": "203.0.113.195, 70.41.3.18" });
    expect(getClientIp(headers1)).toBe("203.0.113.195");

    const headers2 = new Headers({ "x-real-ip": "198.51.100.4" });
    expect(getClientIp(headers2)).toBe("198.51.100.4");

    const headers3 = new Headers();
    expect(getClientIp(headers3)).toBe("127.0.0.1");
  });
});
