import { NextResponse, type NextRequest } from "next/server";
import {
  classifyWasteItem,
  queryGeminiSorter,
  type SortingTelemetry,
} from "@/lib/esd-knowledge";
import { defaultRateLimiter, getClientIp } from "@/lib/rate-limiter";
import { recordUsage } from "@/lib/telemetry";
import { recordWasteSearch } from "@/lib/supabase";

async function resolveSortingQuery(query: string) {
  const startedAt = Date.now();
  const llmResult = await queryGeminiSorter(query);
  if (llmResult) {
    if (llmResult.telemetry.usage) {
      recordUsage(
        llmResult.telemetry.usage.promptTokens,
        llmResult.telemetry.usage.candidateTokens,
        llmResult.telemetry.latencyMs
      );
    }
    return llmResult;
  }

  const verdict = classifyWasteItem(query);
  const telemetry: SortingTelemetry = {
    source: "rules",
    latencyMs: Date.now() - startedAt,
  };
  return { verdict, telemetry, quotaExceeded: false };
}

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return NextResponse.json(
      { error: "Missing item query parameter ?q=" },
      { status: 400 }
    );
  }

  const ip = getClientIp(request.headers);
  const rateCheck = defaultRateLimiter.check(ip, q);
  if (!rateCheck.success) {
    return NextResponse.json(
      { error: rateCheck.error },
      {
        status: rateCheck.statusCode ?? 429,
        headers: {
          "Retry-After": Math.ceil(rateCheck.resetMs / 1000).toString(),
          "X-RateLimit-Limit": "12",
          "X-RateLimit-Remaining": rateCheck.remaining.toString(),
        },
      }
    );
  }

  const result = await resolveSortingQuery(q);

  try {
    await recordWasteSearch({
      query: q,
      itemTitle: result.verdict?.itemTitle,
      destination: result.verdict?.destination,
      source: result.telemetry?.source ?? "rules",
    });
  } catch {
    // Non-blocking telemetry
  }

  return NextResponse.json(result, {
    headers: {
      "X-RateLimit-Limit": "12",
      "X-RateLimit-Remaining": rateCheck.remaining.toString(),
    },
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { query?: string };
    const q = body.query?.trim() ?? "";
    if (!q) {
      return NextResponse.json(
        { error: "Missing query in request body" },
        { status: 400 }
      );
    }

    const ip = getClientIp(request.headers);
    const rateCheck = defaultRateLimiter.check(ip, q);
    if (!rateCheck.success) {
      return NextResponse.json(
        { error: rateCheck.error },
        {
          status: rateCheck.statusCode ?? 429,
          headers: {
            "Retry-After": Math.ceil(rateCheck.resetMs / 1000).toString(),
            "X-RateLimit-Limit": "12",
            "X-RateLimit-Remaining": rateCheck.remaining.toString(),
          },
        }
      );
    }

    const result = await resolveSortingQuery(q);

    try {
      await recordWasteSearch({
        query: q,
        itemTitle: result.verdict?.itemTitle,
        destination: result.verdict?.destination,
        source: result.telemetry?.source ?? "rules",
      });
    } catch {
      // Non-blocking telemetry
    }

    return NextResponse.json(result, {
      headers: {
        "X-RateLimit-Limit": "12",
        "X-RateLimit-Remaining": rateCheck.remaining.toString(),
      },
    });
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
}
