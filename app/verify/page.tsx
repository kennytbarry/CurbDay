import Link from "next/link";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase";

interface VerifyPageProps {
  searchParams?: Promise<{ token?: string }>;
}

export const dynamic = "force-dynamic";

export default async function VerifyPage(props: VerifyPageProps) {
  const params = props.searchParams ? await props.searchParams : {};
  const token = params.token;

  let success = false;
  let alreadyActive = false;
  let isSweeping = false;
  let address = "";
  let email = "";
  let streetName = "";

  if (token) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      // 1. Check curbside collection subscribers matching this token
      const { data: subscriber } = await supabase
        .from("subscribers")
        .select("id, status, address, destination")
        .eq("unsubscribe_token", token)
        .maybeSingle();

      if (subscriber) {
        address = subscriber.address;
        email = subscriber.destination;

        if (subscriber.status === "active") {
          success = true;
          alreadyActive = true;
        } else if (subscriber.status === "pending" || subscriber.status === "unsubscribed") {
          const { error: updateError } = await supabase
            .from("subscribers")
            .update({
              status: "active",
              verified_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", subscriber.id);

          if (!updateError) {
            success = true;
          }
        }
      } else {
        // 2. Check street sweeping subscribers matching this token
        const { data: sweepingSub } = await supabase
          .from("street_sweeping_subscribers")
          .select("id, status, address, destination, street_name")
          .eq("unsubscribe_token", token)
          .maybeSingle();

        if (sweepingSub) {
          isSweeping = true;
          address = sweepingSub.address;
          email = sweepingSub.destination;
          streetName = sweepingSub.street_name;

          if (sweepingSub.status === "active") {
            success = true;
            alreadyActive = true;
          } else if (sweepingSub.status === "pending" || sweepingSub.status === "unsubscribed") {
            const { error: updateError } = await supabase
              .from("street_sweeping_subscribers")
              .update({
                status: "active",
                verified_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", sweepingSub.id);

            if (!updateError) {
              success = true;
            }
          }
        }
      }
    } else {
      // Local preview mock
      success = true;
      address = "Your San Diego Address";
      email = "your-email@example.com";
    }
  }

  return (
    <div className="mx-auto max-w-md pt-12 text-center">
      <div className="relative overflow-hidden rounded-3xl border-2 border-flip-teal/30 border-l-6 border-l-flip-teal bg-white p-6 sm:p-8 shadow-xl">

        {success ? (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 ring-2 ring-emerald-500/20">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-flip-dark">
              {alreadyActive
                ? "Subscription Already Active"
                : isSweeping
                ? 'Street Sweeping Reminders Activated!'
                : "Weekly Reminders Activated!"}
            </h1>
            <p className="text-xs sm:text-sm leading-relaxed text-flip-slate">
              Your email is verified. We&apos;ll send your reminders at <strong>6:00 PM</strong> the evening before{" "}
              {isSweeping ? "street sweeping" : "collection"} for{" "}
              <strong className="text-flip-dark">{streetName || address || "your address"}</strong>.
            </p>
            {email && (
              <p className="text-[11px] font-medium text-flip-slate/80">
                Verified: {email}
              </p>
            )}
            <div className="pt-4 flex flex-col gap-2">
              <Link
                href={address ? `/?address=${encodeURIComponent(address)}` : "/"}
                className="inline-flex h-11 items-center justify-center rounded-full bg-flip-gold px-6 text-xs font-black text-flip-dark shadow-sm hover:bg-flip-goldDark hover:shadow transition-all"
              >
                View Live Schedule on CurbDay
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 ring-2 ring-amber-500/20">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h1 className="text-xl font-black tracking-tight text-flip-dark">
              Invalid or Expired Link
            </h1>
            <p className="text-xs sm:text-sm leading-relaxed text-flip-slate">
              We couldn&apos;t find a pending subscription matching this link. You may have already verified or the link has expired.
            </p>
            <div className="pt-4">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-full border border-flip-teal/20 bg-white px-6 text-xs font-bold text-flip-dark hover:bg-slate-50 transition-all"
              >
                Return to CurbDay
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
