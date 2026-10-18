import { NextResponse, type NextRequest } from "next/server";
import { queryStreetSweeping } from "@/lib/streetSweeping";

export async function GET(request: NextRequest) {
  const address = request.nextUrl.searchParams.get("address")?.trim() ?? "";
  if (!address) {
    return NextResponse.json(
      { error: "Missing address query parameter ?address=" },
      { status: 400 }
    );
  }

  const record = await queryStreetSweeping(address);
  if (!record) {
    return NextResponse.json(
      {
        found: false,
        message: "No municipal street sweeping schedule found for this address.",
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
        },
      }
    );
  }

  return NextResponse.json(
    { found: true, record },
    {
      headers: {
        "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    }
  );
}
