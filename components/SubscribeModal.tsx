"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bell, Car, Check, Loader2, Mail, ShieldCheck, X } from "lucide-react";
import type { StreetSweepingRecord } from "@/lib/streetSweeping";

interface SubscribeModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  trashDay: number;
  recyclingCadence: "alternate_a" | "alternate_b";
  mode?: "collection" | "street_sweeping";
  sweepingData?: StreetSweepingRecord | null;
}

export default function SubscribeModal({
  isOpen,
  onClose,
  address,
  trashDay,
  recyclingCadence,
  mode = "collection",
  sweepingData,
}: SubscribeModalProps) {
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement as HTMLElement | null;

    const focusTimer = setTimeout(() => {
      const emailInput = modalRef.current?.querySelector<HTMLInputElement>(
        'input[type="email"]'
      );
      if (emailInput) {
        emailInput.focus();
      } else {
        const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        focusable?.[0]?.focus();
      }
    }, 50);

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }

      if (e.key === "Tab" && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusable.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!email.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const isSweeping = mode === "street_sweeping";
      const payload = isSweeping
        ? {
            email: email.trim(),
            address,
            mode: "street_sweeping",
            sweeping: sweepingData
              ? {
                  street: sweepingData.street,
                  blockRange: sweepingData.blockRange,
                  day: sweepingData.nextDateFormatted.split(",")[0]?.trim() || "Scheduled Day",
                  frequency: sweepingData.frequency,
                  timeWindow: sweepingData.timeWindow,
                  sides: sweepingData.sides,
                  scheduleRaw: sweepingData.scheduleRaw,
                }
              : null,
            honeypot,
          }
        : {
            email: email.trim(),
            address,
            mode: "collection",
            trashDay,
            recyclingCadence,
            honeypot,
          };

      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.error || "Failed to subscribe. Please try again.");
      } else {
        setSuccessMsg(data.message || "");
        setIsSuccess(true);
      }
    } catch {
      setErrorMessage("Network error. Please check your connection.");
    } finally {
      setIsLoading(false);
    }
  }

  const isSweeping = mode === "street_sweeping";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="subscribe-modal-title"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div
        ref={modalRef}
        className="relative w-full max-w-md rounded-3xl border-2 border-flip-teal/25 bg-white p-6 sm:p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close reminder modal"
          className="absolute right-4 top-4 rounded-full p-1.5 text-flip-slate/60 hover:bg-flip-tealBG hover:text-flip-dark transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-flip-teal"
        >
          <X className="h-4 w-4" />
        </button>

        {isSuccess ? (
          <div className="space-y-4 py-4 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-flip-tealBG text-flip-teal border-2 border-flip-teal/30">
              <Mail className="h-6 w-6" />
            </div>
            <h3
              id="subscribe-modal-title"
              className="text-lg font-black text-flip-dark tracking-tight"
            >
              Check Your Inbox to Confirm
            </h3>
            <p className="text-xs sm:text-sm text-flip-slate leading-relaxed font-medium">
              We emailed a confirmation link to <strong className="text-flip-dark font-bold">{email}</strong>. Click the link in that email to activate {isSweeping ? '"Move Your Car" street sweeping reminders' : "weekly collection reminders"} for:
            </p>
            <div className="rounded-2xl border-2 border-flip-teal/15 bg-slate-50 p-3 text-xs font-bold text-flip-dark">
              {isSweeping && sweepingData
                ? `${sweepingData.street} (${sweepingData.blockRange})`
                : address}
            </div>
            <p className="text-[11px] text-flip-slate/80">
              Didn&apos;t receive it? Check your spam folder. Unsubscribe anytime with 1 click.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="w-full h-11 rounded-full bg-gradient-to-b from-flip-gold to-flip-goldDark text-xs font-black text-flip-dark hover:brightness-105 transition-all shadow-flip-gold-glow active:scale-95 cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-flip-tealBG text-flip-teal border border-flip-teal/20">
                {isSweeping ? (
                  <Car className="h-5 w-5" />
                ) : (
                  <Bell className="h-5 w-5" />
                )}
              </div>
              <div>
                <h3
                  id="subscribe-modal-title"
                  className="text-base font-black text-flip-dark tracking-tight"
                >
                  {isSweeping
                    ? '"Move Your Car" Reminders'
                    : "Weekly Collection Reminders"}
                </h3>
                <p className="text-xs text-flip-slate font-medium">
                  {isSweeping
                    ? "Never miss street sweeping or get a parking ticket"
                    : "Never miss a pickup or holiday delay"}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border-2 border-flip-teal/15 bg-slate-50 p-3 text-xs space-y-1">
              <div className="text-[11px] font-black uppercase tracking-wider text-flip-tealDark">
                {isSweeping ? "Sweeping Route Block" : "Configured Address"}
              </div>
              <div className="font-bold text-flip-dark truncate">
                {isSweeping && sweepingData
                  ? `${sweepingData.street} (${sweepingData.blockRange})`
                  : address}
              </div>
              {isSweeping && sweepingData && (
                <div className="text-[11px] font-semibold text-flip-slate pt-0.5">
                  Next: {sweepingData.nextDateFormatted} · {sweepingData.sides}
                  {sweepingData.timeWindow ? ` (${sweepingData.timeWindow})` : ""}
                </div>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 pt-1">
              {/* Bot Honeypot */}
              <input
                type="text"
                name="b_extra_city"
                value={honeypot}
                onChange={(e) => setHoneypot(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                className="hidden"
                aria-hidden="true"
              />

              <div className="space-y-1.5">
                <label
                  htmlFor="subscriber-email"
                  className="text-xs font-extrabold text-flip-dark"
                >
                  Your Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-flip-slate/60" />
                  <input
                    id="subscriber-email"
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="resident@example.com"
                    className="h-11 w-full rounded-full border-2 border-flip-teal/30 bg-white pl-10 pr-3.5 text-xs sm:text-sm font-semibold text-flip-dark placeholder:text-flip-slate/50 focus:border-flip-teal focus:outline-hidden focus:ring-4 focus:ring-flip-teal/20"
                  />
                </div>
              </div>

              {errorMessage && (
                <p className="text-xs font-bold text-rose-600">
                  {errorMessage}
                </p>
              )}

              <div className="space-y-2 pt-1 text-[11px] text-flip-slate font-medium">
                <div className="flex items-start gap-2">
                  <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                  <span>
                    {isSweeping
                      ? `Sent at 6:00 PM the evening before: reminds you to move your vehicle before ${
                          sweepingData?.timeWindow || "posted sweeping hours"
                        }.`
                      : "Sent at 6:00 PM the evening before: highlights whether Recycling goes out, and automatically adjusts for City holiday delays."}
                  </span>
                </div>
                <div className="flex items-start gap-2">
                  <Check className="h-4 w-4 shrink-0 text-flip-teal mt-0.5" />
                  <span>
                    Unsubscribe anytime with a one-click link included in every email.
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isLoading || !email.trim()}
                  className="w-full h-12 flex items-center justify-center gap-2 rounded-full bg-gradient-to-b from-flip-gold to-flip-goldDark text-xs font-black text-flip-dark hover:brightness-105 transition-all shadow-flip-gold-glow active:scale-95 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-flip-teal"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Saving subscription…</span>
                    </>
                  ) : (
                    <span>
                      {isSweeping
                        ? 'Subscribe to "Move Your Car" Alerts'
                        : "Subscribe to Weekly Reminders"}
                    </span>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
