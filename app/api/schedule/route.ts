import { NextResponse, type NextRequest } from "next/server";
import { resolveSanDiegoAddress } from "@/lib/arcgis";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const address = searchParams.get("address") ?? searchParams.get("q");
  const magicKey = searchParams.get("magicKey") ?? undefined;

  if (!address || !address.trim()) {
    return NextResponse.json(
      { error: "Missing 'address' query parameter." },
      { status: 400 }
    );
  }

  const profile = await resolveSanDiegoAddress(address, magicKey);
  if (!profile) {
    return NextResponse.json(
      { error: "Address not found in City of San Diego service area." },
      { status: 404 }
    );
  }

  return NextResponse.json({ profile });
}
