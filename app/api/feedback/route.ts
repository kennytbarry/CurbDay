import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

interface FeedbackPayload {
  query?: string;
  itemTitle?: string;
  destination?: string;
  feedback?: "up" | "down";
  source?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FeedbackPayload;
    const { query, itemTitle, destination, feedback, source } = body;

    if (!query || !feedback || !["up", "down"].includes(feedback)) {
      return NextResponse.json(
        { error: "Invalid feedback payload" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      // In local dev without Supabase, acknowledge gracefully
      return NextResponse.json({ success: true, stored: false });
    }

    const { error } = await supabase.from("waste_feedback").insert({
      query: query.slice(0, 200),
      item_title: (itemTitle || query).slice(0, 200),
      destination: destination || "unknown",
      feedback,
      source: source || "rules",
    });

    if (error) {
      console.warn("Supabase feedback insert error:", error.message);
      // Return 200 to the client so UI isn't broken if DB permissions are pending
      return NextResponse.json({ success: true, stored: false, warning: error.message });
    }

    return NextResponse.json({ success: true, stored: true });
  } catch (err) {
    console.error("Feedback route error:", err);
    return NextResponse.json({ error: "Failed to record feedback" }, { status: 500 });
  }
}
