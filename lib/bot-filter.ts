// Block only named vulnerability scanners. Preserve SEO/search/AI discovery,
// link previews, uptime checks, and generic API clients.
const BLOCKED_BOTS = [
  "sqlmap",
  "Nikto",
  "masscan",
  "zgrab",
] as const;

const BOT_SIGNATURES = BLOCKED_BOTS.map((name) => ({
  name,
  pattern: new RegExp(`(?:^|[^a-z0-9_-])${name}(?=$|[^a-z0-9_-])`, "i"),
}));

/**
 * User-agent signatures are spoofable, not proof of client identity.
 * A null result means unclassified, not verified human. Use Firewall/BotID
 * for stronger detection; never bypass a deny match based on an allowlisted UA.
 */
export function getBlockedBot(userAgent: string | null): string | null {
  if (!userAgent) return null;

  return BOT_SIGNATURES.find(({ pattern }) => pattern.test(userAgent))?.name ?? null;
}
