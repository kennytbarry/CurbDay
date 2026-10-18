"use client";

import { useEffect, useRef, useState } from "react";
import {
  Calendar,
  Check,
  Copy,
  Download,
  ExternalLink,
  ShieldCheck,
  X,
} from "lucide-react";
import type { StreetSweepingRecord } from "@/lib/streetSweeping";
import { trackCalendarExported } from "@/lib/analytics";

interface CalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  address: string;
  mode?: "collection" | "street_sweeping";
  sweepingData?: StreetSweepingRecord | null;
}

export default function CalendarModal({
  isOpen,
  onClose,
  address,
  mode = "collection",
  sweepingData,
}: CalendarModalProps) {
  const [copiedFeed, setCopiedFeed] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement as HTMLElement | null;

    const focusTimer = setTimeout(() => {
      const focusable = modalRef.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      if (focusable && focusable.length > 0) {
        focusable[0]?.focus();
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

  const encodedAddress = encodeURIComponent(address);
  const host =
    typeof window !== "undefined"
      ? window.location.host
      : "curbday-sd.vercel.app";
  const protocol =
    typeof window !== "undefined" ? window.location.protocol : "https:";

  const isSweeping = mode === "street_sweeping";
  const typeParam = isSweeping ? "&type=sweeping" : "";

  // webcal protocol feed URL (e.g., webcal://curbday-sd.vercel.app/api/calendar?address=...)
  const webcalUrl = `webcal://${host}/api/calendar?address=${encodedAddress}${typeParam}`;
  const httpsFeedUrl = `${protocol}//${host}/api/calendar?address=${encodedAddress}${typeParam}`;
  const googleCalendarUrl = `https://calendar.google.com/calendar/render?cid=${encodeURIComponent(
    webcalUrl
  )}`;
  const downloadUrl = `/api/calendar?address=${encodedAddress}${typeParam}&download=1`;

  function handleCopyFeed() {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(httpsFeedUrl).then(() => {
        setCopiedFeed(true);
        setTimeout(() => setCopiedFeed(false), 2500);
      });
    }
  }

  function handleAppleSubscribe() {
    trackCalendarExported(
      isSweeping ? "webcal_apple_sweeping" : "webcal_apple",
      address
    );
    window.location.href = webcalUrl;
  }

  function handleGoogleSubscribe() {
    trackCalendarExported(
      isSweeping ? "webcal_google_sweeping" : "webcal_google",
      address
    );
    window.open(googleCalendarUrl, "_blank", "noopener,noreferrer");
  }

  function handleDownloadIcs() {
    trackCalendarExported(
      isSweeping ? "ics_download_sweeping" : "ics_download",
      address
    );
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = isSweeping
      ? `curbday-street-sweeping.ics`
      : `curbday-schedule.ics`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="calendar-modal-title"
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
          aria-label="Close calendar modal"
          className="absolute right-4 top-4 rounded-full p-1.5 text-flip-slate/60 hover:bg-flip-tealBG hover:text-flip-dark transition-colors cursor-pointer focus-visible:ring-2 focus-visible:ring-flip-teal"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-flip-tealBG text-flip-teal border border-flip-teal/20">
              <Calendar className="h-5 w-5" />
            </div>
            <div>
              <h3
                id="calendar-modal-title"
                className="text-base font-black text-flip-dark tracking-tight"
              >
                {isSweeping
                  ? "Street Sweeping Calendar"
                  : "Sync with Your Calendar"}
              </h3>
              <p className="text-xs text-flip-slate font-medium">
                {isSweeping
                  ? 'Sync "Move Your Car" reminders to your calendar'
                  : "Live subscribed feed · Auto-syncs holiday slides"}
              </p>
            </div>
          </div>

          <div className="rounded-2xl border-2 border-flip-teal/15 bg-slate-50 p-3 text-xs space-y-1">
            <div className="text-[11px] font-black uppercase tracking-wider text-flip-tealDark">
              {isSweeping ? "Sweeping Route Block" : "Collection Address"}
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

          {/* Subscription Options */}
          <div className="space-y-2.5 pt-1">
            {/* 1. Apple Calendar / iOS / macOS */}
            <button
              type="button"
              onClick={handleAppleSubscribe}
              className="group w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-flip-teal/20 bg-white hover:bg-slate-50 hover:border-flip-teal transition-all text-left cursor-pointer active:scale-[0.99] shadow-xs"
            >
              <div className="space-y-0.5">
                <div className="text-xs font-black text-flip-dark group-hover:text-flip-tealDark transition-colors flex items-center gap-1.5">
                  <span>Apple Calendar / iPhone / Mac</span>
                </div>
                <div className="text-[11px] text-flip-slate font-medium">
                  One-tap native subscription feed
                </div>
              </div>
              <span className="text-xs font-black text-flip-dark px-3 py-1 rounded-full bg-gradient-to-b from-flip-gold to-flip-goldDark group-hover:brightness-105 transition-all shadow-xs">
                Subscribe
              </span>
            </button>

            {/* 2. Google Calendar */}
            <button
              type="button"
              onClick={handleGoogleSubscribe}
              className="group w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-flip-teal/20 bg-white hover:bg-slate-50 hover:border-flip-teal transition-all text-left cursor-pointer active:scale-[0.99] shadow-xs"
            >
              <div className="space-y-0.5">
                <div className="text-xs font-black text-flip-dark group-hover:text-flip-tealDark transition-colors flex items-center gap-1.5">
                  <span>Google Calendar</span>
                  <ExternalLink className="h-3 w-3 opacity-60" />
                </div>
                <div className="text-[11px] text-flip-slate font-medium">
                  Adds to &ldquo;Other calendars&rdquo; web &amp; app
                </div>
              </div>
              <span className="text-xs font-black text-flip-dark px-3 py-1 rounded-full bg-gradient-to-b from-flip-gold to-flip-goldDark group-hover:brightness-105 transition-all shadow-xs">
                Add
              </span>
            </button>

            {/* 3. Copy Feed URL (Outlook & Others) */}
            <button
              type="button"
              onClick={handleCopyFeed}
              className="group w-full flex items-center justify-between p-3.5 rounded-2xl border-2 border-flip-teal/20 bg-white hover:bg-slate-50 hover:border-flip-teal transition-all text-left cursor-pointer active:scale-[0.99] shadow-xs"
            >
              <div className="space-y-0.5">
                <div className="text-xs font-black text-flip-dark group-hover:text-flip-tealDark transition-colors flex items-center gap-1.5">
                  {copiedFeed ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Feed URL Copied!</span>
                    </>
                  ) : (
                    <>
                      <span>Copy Calendar Feed URL</span>
                      <Copy className="h-3 w-3 opacity-60" />
                    </>
                  )}
                </div>
                <div className="text-[11px] text-flip-slate font-medium">
                  For Outlook or any app supporting iCal URLs
                </div>
              </div>
              <span className="text-xs font-bold text-flip-tealDark px-3 py-1 rounded-full bg-white border border-flip-teal/20 transition-all shadow-xs">
                {copiedFeed ? "Copied" : "Copy"}
              </span>
            </button>
          </div>

          {/* Reassurance Callout */}
          <div className="flex items-start gap-2 rounded-2xl bg-emerald-50 border-2 border-emerald-300 p-3 text-[11px] leading-relaxed text-emerald-950 font-medium shadow-xs">
            <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>
              Subscribes as a separate named calendar. You can hide or delete the
              entire feed in one click anytime without deleting individual events.
            </span>
          </div>

          {/* Static fallback */}
          <div className="pt-1 text-center">
            <button
              type="button"
              onClick={handleDownloadIcs}
              className="inline-flex items-center gap-1 text-[11px] font-bold text-flip-tealDark hover:text-flip-teal transition-colors cursor-pointer underline"
            >
              <Download className="h-3 w-3" />
              <span>Or download static .ics file</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
