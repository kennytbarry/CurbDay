import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({
      ok: true,
      mock: true,
      message: "Unsubscribed successfully (Mock mode).",
    });
  }

  let address = "";
  let email = "";

  const { data: subData } = await supabase
    .from("subscribers")
    .update({ status: "unsubscribed", updated_at: new Date().toISOString() })
    .eq("unsubscribe_token", token)
    .select("address, destination")
    .maybeSingle();

  if (subData) {
    address = subData.address;
    email = subData.destination;
  } else {
    const { data: sweepData } = await supabase
      .from("street_sweeping_subscribers")
      .update({ status: "unsubscribed", updated_at: new Date().toISOString() })
      .eq("unsubscribe_token", token)
      .select("address, destination")
      .maybeSingle();

    if (sweepData) {
      address = sweepData.address;
      email = sweepData.destination;
    } else {
      return NextResponse.json(
        { error: "Invalid or expired unsubscribe link." },
        { status: 404 }
      );
    }
  }

  return NextResponse.json({
    ok: true,
    address,
    email,
  });
}

export async function POST(request: NextRequest) {
  // Support RFC 8058 One-Click Unsubscribe headers
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data } = await supabase
      .from("subscribers")
      .update({ status: "unsubscribed", updated_at: new Date().toISOString() })
      .eq("unsubscribe_token", token)
      .select("id")
      .maybeSingle();

    if (!data) {
      await supabase
        .from("street_sweeping_subscribers")
        .update({ status: "unsubscribed", updated_at: new Date().toISOString() })
        .eq("unsubscribe_token", token);
    }
  }

  return NextResponse.json({ ok: true, message: "Unsubscribed." });
}
