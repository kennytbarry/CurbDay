/**
 * In-memory sliding-window rate limiter for public API endpoints.
 * Protects Gemini API tokens and backend scrapers from abuse/DDoS.
 */

interface RateLimitRecord {
  timestamps: number[];
}

export interface RateLimiterOptions {
  /** Maximum allowed requests within the window. Defaults to 12. */
  maxRequests?: number;
  /** Sliding window in milliseconds. Defaults to 60,000 (1 minute). */
  windowMs?: number;
  /** Maximum length of incoming search/query string. Defaults to 100 chars. */
  maxQueryLength?: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetMs: number;
  error?: string;
  statusCode?: number;
}

export class InMemoryRateLimiter {
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private readonly maxQueryLength: number;
  private readonly storage = new Map<string, RateLimitRecord>();
  private lastCleanup = Date.now();

  constructor(options: RateLimiterOptions = {}) {
    this.maxRequests = options.maxRequests ?? 12;
    this.windowMs = options.windowMs ?? 60_000;
    this.maxQueryLength = options.maxQueryLength ?? 100;
  }

  /**
   * Checks whether the client request is permitted under rate and length limits.
   */
  check(ip: string, query?: string): RateLimitResult {
    const now = Date.now();
    this.cleanupIfNecessary(now);

    // 1. Enforce query length cap if query is provided
    if (query && query.length > this.maxQueryLength) {
      return {
        success: false,
        remaining: 0,
        resetMs: 0,
        error: `Query too long. Maximum allowed length is ${this.maxQueryLength} characters.`,
        statusCode: 400,
      };
    }

    const key = ip.trim() || "127.0.0.1";
    let record = this.storage.get(key);

    if (!record) {
      record = { timestamps: [] };
      this.storage.set(key, record);
    }

    // Filter out timestamps outside the active window
    const windowStart = now - this.windowMs;
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= this.maxRequests) {
      const oldestInWindow = record.timestamps[0];
      const resetMs = Math.max(0, oldestInWindow + this.windowMs - now);

      return {
        success: false,
        remaining: 0,
        resetMs,
        error: `Too many requests. Rate limit is ${this.maxRequests} requests per minute. Please try again shortly.`,
        statusCode: 429,
      };
    }

    // Record this request
    record.timestamps.push(now);
    const remaining = this.maxRequests - record.timestamps.length;
    const resetMs = this.windowMs;

    return {
      success: true,
      remaining,
      resetMs,
    };
  }

  /** Reset internal storage (useful for testing) */
  reset(): void {
    this.storage.clear();
    this.lastCleanup = Date.now();
  }

  private cleanupIfNecessary(now: number): void {
    // Run cleanup at most once every 2 minutes or when storage grows large
    if (now - this.lastCleanup < 120_000 && this.storage.size < 5000) {
      return;
    }

    this.lastCleanup = now;
    const windowStart = now - this.windowMs;

    for (const [key, record] of this.storage.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > windowStart);
      if (record.timestamps.length === 0) {
        this.storage.delete(key);
      }
    }
  }
}

/** Global default rate limiter for Gemini/Sorter endpoints (12 req/min, 100 char limit) */
export const defaultRateLimiter = new InMemoryRateLimiter({
  maxRequests: 12,
  windowMs: 60_000,
  maxQueryLength: 100,
});

/**
 * Extracts the client IP address from incoming Next.js Request headers.
 */
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = headers.get("x-real-ip");
  if (realIp?.trim()) {
    return realIp.trim();
  }

  const cfConnectingIp = headers.get("cf-connecting-ip");
  if (cfConnectingIp?.trim()) {
    return cfConnectingIp.trim();
  }

  return "127.0.0.1";
}
