import { NextResponse } from "next/server";
import { getSpecialEventsData } from "@/lib/specialEventsScraper";

export const revalidate = 604800; // 7 days edge caching

export async function GET() {
  const data = await getSpecialEventsData();
  return NextResponse.json(data);
}
