import { NextResponse, type NextRequest } from "next/server";
import { resolveSanDiegoAddress } from "@/lib/arcgis";
import { getCollectionEvents, slugify } from "@/lib/schedule";
import {
  buildCollectionCalendar,
  buildStreetSweepingCalendar,
} from "@/lib/ics-generator";
import {
  getSweepingDates,
  queryStreetSweeping,
} from "@/lib/streetSweeping";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const address = searchParams.get("address") ?? searchParams.get("q");

  if (!address || !address.trim()) {
    return new NextResponse("Missing address query parameter", { status: 400 });
  }

  const isDownload = searchParams.get("download") === "1";
  const isSweeping = searchParams.get("type") === "sweeping";
  const now = new Date();

  if (isSweeping) {
    const record = await queryStreetSweeping(address, now);
    if (!record) {
      return new NextResponse(
        "Street sweeping schedule not found for address",
        { status: 404 }
      );
    }
    const slug = slugify(address);
    const dates = getSweepingDates(record.scheduleRaw, now, 12);
    const icsBody = buildStreetSweepingCalendar({
      address,
      slug,
      street: record.street,
      blockRange: record.blockRange,
      isPosted: record.isPosted,
      timeWindow: record.timeWindow,
      sides: record.sides,
      frequency: record.frequency,
      dates,
      now,
    });

    return new NextResponse(icsBody, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `${
          isDownload ? "attachment" : "inline"
        }; filename="curbday-sweeping-${slug}.ics"`,
        "Cache-Control":
          "public, max-age=43200, s-maxage=86400, stale-while-revalidate=86400",
      },
    });
  }

  const profile = await resolveSanDiegoAddress(address);
  if (!profile) {
    return new NextResponse(
      "Address not found in City of San Diego ESD collection service area",
      { status: 404 }
    );
  }

  const events = getCollectionEvents(profile, now, 52);
  const slug = slugify(profile.address);
  const icsBody = buildCollectionCalendar({
    address: profile.address,
    slug,
    events,
    now,
  });

  return new NextResponse(icsBody, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `${
        isDownload ? "attachment" : "inline"
      }; filename="curbday-${slug}.ics"`,
      "Cache-Control":
        "public, max-age=43200, s-maxage=86400, stale-while-revalidate=86400",
    },
  });
}
