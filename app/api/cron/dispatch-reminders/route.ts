import { NextResponse, type NextRequest } from "next/server";
import {
  getSupabaseAdmin,
  type SubscriberRecord,
  type StreetSweepingSubscriberRecord,
} from "@/lib/supabase";
import {
  sendWeeklyReminder,
  sendHolidayAlert,
  sendStreetSweepingReminder,
} from "@/lib/email";
import {
  addCalendarDays,
  formatDateKey,
  getEffectivePickupDate,
  getMondayOfWeek,
  getPacificCalendarDate,
  isSameCalendarDay,
} from "@/lib/holidays";
import { isRecyclingWeek } from "@/lib/schedule";
import { calculateNextSweepingDate } from "@/lib/streetSweeping";
import { extractStreetAddress } from "@/lib/esd";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  // Verify Vercel Cron Secret (if configured)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return NextResponse.json({
      ok: false,
      message: "Supabase admin client not configured.",
    });
  }

  // Pacific Time calculation (America/Los_Angeles)
  // Vercel cron runs at 02:00 UTC (7:00 PM PDT / 6:00 PM PST).
  // Using getPacificCalendarDate ensures we evaluate the current local Pacific evening,
  // preventing reminders from triggering 2 nights early due to UTC date rollover.
  const todayPacific = getPacificCalendarDate();
  const tomorrow = addCalendarDays(todayPacific, 1);
  const tomorrowDayOfWeek = tomorrow.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
  const tomorrowDateStr = formatDateKey(tomorrow);

  // Fetch all active email subscribers
  const { data: subscribers, error } = await supabase
    .from("subscribers")
    .select("*")
    .eq("status", "active")
    .eq("channel", "email");

  if (error || !subscribers) {
    console.error("Failed to fetch subscribers:", error);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }

  const results: {
    subscriberId: string;
    email: string;
    status: string;
    type?: string;
  }[] = [];

  for (const rawSub of subscribers) {
    const sub = rawSub as SubscriberRecord;
    const weekMonday = getMondayOfWeek(tomorrow);
    const scheduledDate = addCalendarDays(weekMonday, sub.trash_day - 1);
    const pickup = getEffectivePickupDate(scheduledDate, sub.address);

    const isPickupTomorrow = isSameCalendarDay(pickup.actualDate, tomorrow);
    const isHolidayEveWarning =
      pickup.isDelayed && isSameCalendarDay(pickup.originalDate, tomorrow);

    if (!isPickupTomorrow && !isHolidayEveWarning) {
      continue;
    }

    const notificationType = isHolidayEveWarning
      ? "holiday_slide_alert"
      : "evening_reminder";

    // Check if already dispatched today to prevent duplicates
    const { data: existingLog } = await supabase
      .from("notification_logs")
      .select("id")
      .eq("subscriber_id", sub.id)
      .eq("notification_date", tomorrowDateStr)
      .eq("notification_type", notificationType)
      .maybeSingle();

    if (existingLog) {
      continue;
    }

    const anchor =
      sub.recycling_cadence === "alternate_b"
        ? new Date(2026, 0, 12, 12, 0, 0)
        : new Date(2026, 0, 5, 12, 0, 0);
    const recyclingActive = isRecyclingWeek(pickup.originalDate, anchor);
    const carts = recyclingActive
      ? "Trash + Organics + Recycling"
      : "Trash + Organics";

    const unsubscribeUrl = `https://curbday-sd.vercel.app/unsubscribe?token=${sub.unsubscribe_token}`;
    const oneClickUnsubUrl = `https://curbday-sd.vercel.app/api/unsubscribe?token=${sub.unsubscribe_token}`;

    const displayAddress = extractStreetAddress(sub.address);
    const subject = isHolidayEveWarning
      ? `Holiday Delay: No collection tomorrow for ${displayAddress} (${pickup.holidayName || "City Holiday"})`
      : `CurbDay Reminder: ${carts} for ${displayAddress}`;

    // Dispatch email reminder via Gmail SMTP
    let deliveryStatus = "logged";
    const sent = isHolidayEveWarning
      ? await sendHolidayAlert({
          to: sub.destination,
          address: sub.address,
          holidayName: pickup.holidayName || "City Holiday",
          unsubscribeUrl,
          oneClickUnsubUrl,
        })
      : await sendWeeklyReminder({
          to: sub.destination,
          address: sub.address,
          carts,
          recyclingActive,
          unsubscribeUrl,
          oneClickUnsubUrl,
        });

    if (sent) {
      deliveryStatus = "sent";
    }

    // Record in notification logs
    await supabase.from("notification_logs").insert({
      subscriber_id: sub.id,
      notification_date: tomorrowDateStr,
      notification_type: notificationType,
      channel: "email",
      payload_summary: subject,
    });

    results.push({
      subscriberId: sub.id,
      email: sub.destination,
      status: deliveryStatus,
      type: notificationType,
    });
  }

  // -------------------------------------------------------------
  // Process Active Street Sweeping Subscribers
  // -------------------------------------------------------------
  const { data: sweepingSubscribers } = await supabase
    .from("street_sweeping_subscribers")
    .select("*")
    .eq("status", "active")
    .eq("channel", "email");

  if (sweepingSubscribers && sweepingSubscribers.length > 0) {
    for (const rawSub of sweepingSubscribers) {
      const sub = rawSub as StreetSweepingSubscriberRecord;
      if (!sub.schedule_raw) continue;

      try {
        const nextSweeping = calculateNextSweepingDate(sub.schedule_raw, todayPacific);
        const sweepingYear = nextSweeping.nextDate.getUTCFullYear();
        const sweepingMonth = String(nextSweeping.nextDate.getUTCMonth() + 1).padStart(2, "0");
        const sweepingDay = String(nextSweeping.nextDate.getUTCDate()).padStart(2, "0");
        const sweepingDateStr = `${sweepingYear}-${sweepingMonth}-${sweepingDay}`;
        const isSweepingTomorrow = sweepingDateStr === tomorrowDateStr;

        if (!isSweepingTomorrow) {
          continue;
        }

        // Avoid duplicate alerts on the same date
        const { data: existingLog } = await supabase
          .from("sweeping_notification_logs")
          .select("id")
          .eq("subscriber_id", sub.id)
          .eq("notification_date", tomorrowDateStr)
          .maybeSingle();

        if (existingLog) {
          continue;
        }

        const unsubscribeUrl = `https://curbday-sd.vercel.app/unsubscribe?token=${sub.unsubscribe_token}`;
        const oneClickUnsubUrl = `https://curbday-sd.vercel.app/api/unsubscribe?token=${sub.unsubscribe_token}`;

        let deliveryStatus = "logged";
        const sent = await sendStreetSweepingReminder({
          to: sub.destination,
          address: sub.address,
          street: sub.street_name,
          blockRange: sub.block_range,
          timeWindow: sub.time_window,
          sides: sub.sides,
          frequency: sub.frequency,
          unsubscribeUrl,
          oneClickUnsubUrl,
        });

        if (sent) {
          deliveryStatus = "sent";
        }

        await supabase.from("sweeping_notification_logs").insert({
          subscriber_id: sub.id,
          notification_date: tomorrowDateStr,
          notification_type: "street_sweeping_reminder",
          channel: "email",
          payload_summary: `Move car reminder for ${sub.street_name}`,
        });

        results.push({
          subscriberId: sub.id,
          email: sub.destination,
          status: deliveryStatus,
          type: "street_sweeping_reminder",
        });
      } catch (sweepingErr) {
        console.error("Sweeping reminder dispatch error:", sweepingErr);
      }
    }
  }

  return NextResponse.json({
    ok: true,
    processedDate: tomorrowDateStr,
    dispatchedCount: results.length,
    results,
  });
}
