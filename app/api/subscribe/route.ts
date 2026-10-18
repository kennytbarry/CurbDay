import { NextResponse, type NextRequest } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { sendVerificationEmail } from "@/lib/email";
import { InMemoryRateLimiter } from "@/lib/rate-limiter";
import crypto from "crypto";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const subscribeLimiter = new InMemoryRateLimiter({
  maxRequests: 5,
  windowMs: 10 * 60 * 1000, // 5 requests per 10 mins per IP
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, address, trashDay, recyclingCadence, honeypot } = body;

    // Honeypot check - silently discard bot submissions
    if (honeypot || body.b_extra_city || body.website) {
      return NextResponse.json({
        ok: true,
        message: "Verification email sent! Please check your inbox.",
      });
    }

    // IP rate limiting
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "127.0.0.1";
    const limitResult = subscribeLimiter.check(ip);
    if (!limitResult.success) {
      return NextResponse.json(
        { error: "Too many subscription attempts. Please wait a few minutes." },
        { status: 429 }
      );
    }

    if (!email || typeof email !== "string" || !EMAIL_REGEX.test(email.trim())) {
      return NextResponse.json(
        { error: "Please enter a valid email address." },
        { status: 400 }
      );
    }

    if (!address || typeof address !== "string") {
      return NextResponse.json(
        { error: "Address is required to set up reminders." },
        { status: 400 }
      );
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanAddress = address.trim();
    const isSweeping = body.mode === "street_sweeping";

    const supabase = getSupabaseAdmin();

    // Resolve base URL for verification link
    const origin =
      request.headers.get("origin") ||
      (request.headers.get("host") ? `https://${request.headers.get("host")}` : "") ||
      process.env.NEXT_PUBLIC_APP_URL ||
      "https://curbday-sd.vercel.app";

    // -------------------------------------------------------------
    // STREET SWEEPING REMINDERS SUBSCRIPTION
    // -------------------------------------------------------------
    if (isSweeping) {
      const sweeping = body.sweeping || {};
      const streetName = (sweeping.street || cleanAddress.split(",")[0] || "Residential Street").trim();
      const sweepingDay = (sweeping.day || "Scheduled Day").trim();
      const frequency = (sweeping.frequency || "Scheduled Cadence").trim();
      const blockRange = sweeping.blockRange?.trim() || null;
      const timeWindow = sweeping.timeWindow?.trim() || null;
      const sides = sweeping.sides?.trim() || null;
      const scheduleRaw = sweeping.scheduleRaw?.trim() || null;

      if (!supabase) {
        return NextResponse.json({
          ok: true,
          mock: true,
          message: "Verification email simulated! (Local preview mode)",
        });
      }

      // Check existing in street_sweeping_subscribers
      const { data: existing, error: selectErr } = await supabase
        .from("street_sweeping_subscribers")
        .select("id, status, unsubscribe_token")
        .eq("destination", cleanEmail)
        .eq("address", cleanAddress)
        .eq("sweeping_day", sweepingDay)
        .maybeSingle();

      if (selectErr) {
        if (selectErr.code === "42P01") {
          console.error("street_sweeping_subscribers table does not exist in Supabase yet. Run supabase/migrations/20261021_street_sweeping.sql");
          return NextResponse.json(
            {
              error: "Database table street_sweeping_subscribers not found. Please run the SQL migration (supabase/migrations/20261021_street_sweeping.sql) in your Supabase SQL editor.",
              migrationRequired: true,
            },
            { status: 503 }
          );
        }
        if (selectErr.code === "42501") {
          console.error("Permission denied on street_sweeping_subscribers: run GRANT ALL ON TABLE public.street_sweeping_subscribers TO service_role; in Supabase SQL editor.");
          return NextResponse.json(
            {
              error: "Supabase table permission denied. In your Supabase SQL editor, run: GRANT ALL ON TABLE public.street_sweeping_subscribers TO service_role;",
              permissionRequired: true,
            },
            { status: 500 }
          );
        }
      }

      let unsubscribeToken = existing?.unsubscribe_token;
      if (!unsubscribeToken) {
        unsubscribeToken = crypto.randomBytes(24).toString("hex");
      }
      const newStatus = existing?.status === "active" ? "active" : "pending";

      const { error: upsertError } = await supabase
        .from("street_sweeping_subscribers")
        .upsert(
          {
            destination: cleanEmail,
            channel: "email",
            address: cleanAddress,
            street_name: streetName,
            block_range: blockRange,
            sweeping_day: sweepingDay,
            frequency: frequency,
            time_window: timeWindow,
            sides: sides,
            schedule_raw: scheduleRaw,
            status: newStatus,
            unsubscribe_token: unsubscribeToken,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "destination,address,sweeping_day",
          }
        );

      if (upsertError) {
        console.error("Supabase sweeping subscribe error:", upsertError);
        if (upsertError.code === "42501") {
          return NextResponse.json(
            {
              error: "Supabase table permission denied. In your Supabase SQL editor, run: GRANT ALL ON TABLE public.street_sweeping_subscribers TO service_role;",
              permissionRequired: true,
            },
            { status: 500 }
          );
        }
        return NextResponse.json(
          { error: "Failed to save street sweeping subscription. Please try again." },
          { status: 500 }
        );
      }

      const verifyUrl = `${origin}/verify?token=${unsubscribeToken}`;

      await sendVerificationEmail({
        to: cleanEmail,
        address: cleanAddress,
        verifyUrl,
        mode: "street_sweeping",
        sweepingDetails: {
          street: streetName,
          blockRange,
          timeWindow,
          frequency,
          sides,
        },
      });

      return NextResponse.json({
        ok: true,
        pending: newStatus === "pending",
        message:
          newStatus === "active"
            ? "Your street sweeping reminders are already active for this street!"
            : "Verification email sent! Check your inbox to activate reminders.",
      });
    }

    // -------------------------------------------------------------
    // CURBSIDE COLLECTION REMINDERS SUBSCRIPTION
    // -------------------------------------------------------------
    const cleanTrashDay = Number(trashDay);
    const cleanCadence =
      recyclingCadence === "alternate_b" ? "alternate_b" : "alternate_a";

    if (isNaN(cleanTrashDay) || cleanTrashDay < 1 || cleanTrashDay > 5) {
      return NextResponse.json(
        { error: "Invalid collection schedule data." },
        { status: 400 }
      );
    }

    if (!supabase) {
      // In local dev without credentials, return a mock success
      console.warn(
        "Supabase credentials not configured in .env.local (SUPABASE_SERVICE_ROLE_KEY & NEXT_PUBLIC_SUPABASE_URL)."
      );
      return NextResponse.json({
        ok: true,
        mock: true,
        message: "Verification email simulated! (Local preview mode without live Supabase credentials)",
      });
    }

    // Check if user already exists
    const { data: existing } = await supabase
      .from("subscribers")
      .select("id, status, unsubscribe_token")
      .eq("destination", cleanEmail)
      .eq("address", cleanAddress)
      .maybeSingle();

    let unsubscribeToken = existing?.unsubscribe_token;
    if (!unsubscribeToken) {
      unsubscribeToken = crypto.randomBytes(24).toString("hex");
    }

    // Determine target status:
    // If user is already active, keep them active; otherwise set to pending
    const newStatus = existing?.status === "active" ? "active" : "pending";

    const { error: upsertError } = await supabase.from("subscribers").upsert(
      {
        destination: cleanEmail,
        channel: "email",
        address: cleanAddress,
        trash_day: cleanTrashDay,
        recycling_cadence: cleanCadence,
        status: newStatus,
        unsubscribe_token: unsubscribeToken,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "destination,address",
      }
    );

    if (upsertError) {
      console.error("Supabase subscribe error:", upsertError);
      return NextResponse.json(
        { error: "Failed to save subscription. Please try again." },
        { status: 500 }
      );
    }

    const verifyUrl = `${origin}/verify?token=${unsubscribeToken}`;

    // Send verification email via Gmail SMTP
    const emailSent = await sendVerificationEmail({
      to: cleanEmail,
      address: cleanAddress,
      verifyUrl,
    });

    if (!emailSent) {
      console.warn("Failed to dispatch verification email via Gmail SMTP.");
    }

    return NextResponse.json({
      ok: true,
      pending: newStatus === "pending",
      message:
        newStatus === "active"
          ? "Your subscription is already active for this address!"
          : "Verification email sent! Check your inbox to activate reminders.",
    });
  } catch (err) {
    console.error("Subscription handler error:", err);
    return NextResponse.json(
      { error: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
