import { NextResponse } from "next/server";
import { getUsageSnapshot } from "@/lib/telemetry";

export async function GET() {
  const snapshot = getUsageSnapshot();
  return NextResponse.json(snapshot);
}
