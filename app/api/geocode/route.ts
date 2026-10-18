import { NextResponse, type NextRequest } from "next/server";
import {
  resolveSanDiegoAddress,
  suggestSanDiegoAddresses,
} from "@/lib/arcgis";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const query = searchParams.get("q");
  const address = searchParams.get("address");
  const magicKey = searchParams.get("magicKey") ?? undefined;

  if (address) {
    const profile = await resolveSanDiegoAddress(address, magicKey);
    if (!profile) {
      return NextResponse.json(
        { error: "Address not found in City of San Diego service area." },
        { status: 404 }
      );
    }
    return NextResponse.json({ profile });
  }

  if (query !== null) {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return NextResponse.json({ completions: [] });
    }
    const completions = await suggestSanDiegoAddresses(trimmed, 6);
    return NextResponse.json({ completions });
  }

  return NextResponse.json({ completions: [] });
}
