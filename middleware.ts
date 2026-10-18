import { NextResponse, type NextRequest } from "next/server";
import { getBlockedBot } from "@/lib/bot-filter";

// Next.js 16 deprecates this convention, but middleware.ts still defaults to
// Edge. proxy.ts uses Node.js instead; retain middleware for Edge execution.
export function middleware(request: NextRequest) {
  const bot = getBlockedBot(request.headers.get("user-agent"));
  if (!bot) return NextResponse.next();

  // Deliberately omit IPs, user agents, and URLs (queries may contain addresses).
  console.info(JSON.stringify({ event: "bot_blocked", bot, action: "deny" }));

  return NextResponse.json(
    { error: "Forbidden" },
    {
      status: 403,
      headers: {
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex",
        "X-CurbDay-Bot-Action": "deny",
      },
    }
  );
}

export const config = {
  // Keep APIs protected, even if their paths contain dots. Exclude only
  // framework/platform endpoints and explicit public assets/discovery files.
  matcher: [
    "/((?!_next/static(?:/|$)|_next/image(?:/|$)|_vercel(?:/|$)|icons(?:/|$)|favicon\\.ico$|robots\\.txt$|sitemap\\.xml$|manifest\\.(?:webmanifest|json)$|opengraph-image(?:/|$|\\.[a-z]+$)|icon(?:/|$|\\.[a-z]+$)|llms(?:-full)?\\.txt$).*)",
  ],
};
