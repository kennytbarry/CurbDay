import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let adminClient: SupabaseClient | null = null;

/**
 * Returns a server-side Supabase admin client using the secret Service Role key.
 * Used exclusively in API routes and cron jobs; NEVER exposed to the browser.
 */
export function getSupabaseAdmin(): SupabaseClient | null {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

  if (!url || !key) {
    return null;
  }

  if (!adminClient) {
    adminClient = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }

  return adminClient;
}

export interface SubscriberRecord {
  id: string;
  destination: string;
  channel: "email" | "sms";
  address: string;
  trash_day: number;
  recycling_cadence: "alternate_a" | "alternate_b";
  status: "pending" | "active" | "unsubscribed" | "bounced";
  unsubscribe_token: string;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface StreetSweepingSubscriberRecord {
  id: string;
  destination: string;
  channel: "email" | "sms";
  address: string;
  street_name: string;
  block_range: string | null;
  sweeping_day: string;
  frequency: string;
  time_window: string | null;
  sides: string | null;
  schedule_raw: string | null;
  status: "pending" | "active" | "unsubscribed" | "bounced";
  unsubscribe_token: string;
  verified_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface WasteSearchRecord {
  id: string;
  query: string;
  normalized_query: string;
  item_title: string | null;
  destination: string | null;
  source: string;
  created_at: string;
}

/**
 * Records a bin sorter query into Supabase for pattern analysis and telemetry.
 * Fails safely and non-blockingly if Supabase is offline or unconfigured.
 */
export async function recordWasteSearch(params: {
  query: string;
  itemTitle?: string | null;
  destination?: string | null;
  source?: string | null;
}): Promise<void> {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) return;

    const trimmed = params.query.trim();
    if (!trimmed) return;

    const { error } = await supabase.from("waste_searches").insert({
      query: trimmed.slice(0, 300),
      normalized_query: trimmed.toLowerCase().slice(0, 300),
      item_title: params.itemTitle?.slice(0, 300) || null,
      destination: params.destination || null,
      source: params.source || "rules",
    });

    if (error) {
      console.warn("Supabase waste search insert warning:", error.message);
    }
  } catch (err) {
    console.warn("Failed to record waste search in Supabase:", err);
  }
}
