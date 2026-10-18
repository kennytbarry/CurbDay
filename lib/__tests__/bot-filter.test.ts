import { describe, expect, it } from "vitest";
import { getBlockedBot } from "@/lib/bot-filter";

describe("getBlockedBot", () => {
  it.each([
    ["sqlmap/1.9", "sqlmap"],
    ["Mozilla/5.0 (compatible; NIKTO/2.5)", "Nikto"],
    ["masscan/1.3", "masscan"],
    ["zgrab/0.x", "zgrab"],
  ])("identifies %s", (userAgent, expected) => {
    expect(getBlockedBot(userAgent)).toBe(expected);
  });

  it.each([
    null,
    "",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1",
    "Googlebot/2.1",
    "bingbot/2.0",
    "Applebot/0.1",
    "Mozilla/5.0 (compatible; AhrefsBot/7.0; +https://ahrefs.com/robot/)",
    "Mozilla/5.0 (compatible; SemrushBot/7~bl)",
    "MJ12bot/v1.4.8",
    "DotBot/1.2",
    "BLEXBot/1.0",
    "GPTBot/1.0",
    "ChatGPT-User/1.0",
    "PerplexityBot/1.0",
    "ClaudeBot/1.0",
    "Google-Extended",
    "Applebot-Extended",
    "Cohere-ai",
    "facebookexternalhit/1.1",
    "Twitterbot/1.0",
    "Slackbot-LinkExpanding 1.0",
    "UptimeRobot/2.0",
    "curl/8.7.1",
    "python-requests/2.32.0",
    "HeadlessChrome/130.0",
    "CustomBot/1.0",
    "NotAhrefsBot/1.0",
    "my-sqlmap-client/1.0",
  ])("does not deny unclassified or permitted clients: %s", (userAgent) => {
    expect(getBlockedBot(userAgent)).toBeNull();
  });

  it("is case insensitive", () => {
    expect(getBlockedBot("sQlMaP/1.9")).toBe("sqlmap");
  });

  it("does not let a claimed search identity override a deny signature", () => {
    expect(getBlockedBot("Googlebot/2.1 sqlmap/1.9")).toBe("sqlmap");
  });
});
