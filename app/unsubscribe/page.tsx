import Link from "next/link";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { getSupabaseAdmin } from "@/lib/supabase";

interface UnsubscribePageProps {
  searchParams?: Promise<{ token?: string }>;
}

export default async function UnsubscribePage(props: UnsubscribePageProps) {
  const params = props.searchParams ? await props.searchParams : {};
  const token = params.token;

  let success = false;
  let address = "";
  let email = "";
  let isSweeping = false;

  if (token) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      const { data } = await supabase
        .from("subscribers")
        .update({
          status: "unsubscribed",
          updated_at: new Date().toISOString(),
        })
        .eq("unsubscribe_token", token)
        .select("address, destination")
        .maybeSingle();

      if (data) {
        success = true;
        address = data.address;
        email = data.destination;
      } else {
        const { data: sweepData } = await supabase
          .from("street_sweeping_subscribers")
          .update({
            status: "unsubscribed",
            updated_at: new Date().toISOString(),
          })
          .eq("unsubscribe_token", token)
          .select("address, destination")
          .maybeSingle();

        if (sweepData) {
          success = true;
          isSweeping = true;
          address = sweepData.address;
          email = sweepData.destination;
        }
      }
    } else {
      // Mock preview
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
              Unsubscribed Successfully
            </h1>
            <p className="text-xs sm:text-sm leading-relaxed text-flip-slate">
              You will no longer receive {isSweeping ? "street sweeping reminders" : "weekly collection reminders or holiday alerts"} for{" "}
              <strong className="text-flip-dark">{address || "this address"}</strong>.
            </p>
            {email && (
              <p className="text-[11px] font-medium text-flip-slate/80">
                Removed: {email}
              </p>
            )}
            <div className="pt-4">
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-full bg-flip-gold px-6 text-xs font-black text-flip-dark shadow-sm hover:bg-flip-goldDark transition-all"
              >
                Return to CurbDay
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
              We couldn&apos;t find an active subscription matching this link. You may have already unsubscribed.
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
