"use client";

import { useState, type FormEvent } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  CheckCircle2,
  ChevronRight,
  Copy,
  HelpCircle,
  Leaf,
  Loader2,
  Recycle,
  Search,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  X,
} from "lucide-react";
import {
  classifyWasteItem,
  getActionableSteps,
  getConditionalPivot,
  getQuickWhy,
  getSituationalOptions,
  type BinDestination,
  type SortingVerdict,
} from "@/lib/esd-knowledge";
import type { EventCategoryFilter } from "@/lib/specialEvents";
import { trackWasteAdvisorQueried } from "@/lib/analytics";

interface WasteAdvisorProps {
  onSelectSpecialCategory?: (category: EventCategoryFilter) => void;
}

const QUICK_DILEMMAS = [
  "Greasy pizza box",
  "Plastic bags",
  "Styrofoam",
  "Shredded paper",
  "Dog poop",
  "Tree stump",
  "Meat & bones",
  "Wrapping paper",
  "Batteries",
] as const;

const DESTINATION_STYLES: Record<
  BinDestination,
  {
    cardClass: string;
    badgeClass: string;
    icon: typeof Recycle;
    accentColor: string;
    iconClass: string;
  }
> = {
  blue: {
    cardClass: "bg-white border-blue-500/30",
    badgeClass: "text-blue-800 bg-blue-100 border border-blue-300",
    icon: Recycle,
    accentColor: "text-blue-700",
    iconClass: "bg-blue-600 text-white border border-blue-700",
  },
  green: {
    cardClass: "bg-white border-emerald-500/30",
    badgeClass: "text-emerald-800 bg-emerald-100 border border-emerald-300",
    icon: Leaf,
    accentColor: "text-emerald-700",
    iconClass: "bg-emerald-600 text-white border border-emerald-700",
  },
  black: {
    cardClass: "bg-white border-zinc-300",
    badgeClass: "text-zinc-800 bg-zinc-100 border border-zinc-300",
    icon: Trash2,
    accentColor: "text-zinc-800",
    iconClass: "bg-zinc-800 text-zinc-100 border border-zinc-900",
  },
  dropoff: {
    cardClass: "bg-white border-rose-400/30",
    badgeClass: "text-rose-800 bg-rose-100 border border-rose-300",
    icon: AlertTriangle,
    accentColor: "text-rose-700",
    iconClass: "bg-rose-600 text-white border border-rose-700",
  },
};

export default function WasteAdvisor({
  onSelectSpecialCategory,
}: WasteAdvisorProps = {}) {
  const [query, setQuery] = useState("");
  const [verdict, setVerdict] = useState<SortingVerdict | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<"up" | "down" | null>(null);
  const [copied, setCopied] = useState(false);
  const [quotaHit, setQuotaHit] = useState(false);

  async function handleFeedbackClick(type: "up" | "down") {
    if (!verdict) return;
    const nextFeedback = feedback === type ? null : type;
    setFeedback(nextFeedback);

    if (nextFeedback) {
      try {
        await fetch("/api/feedback", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: verdict.query,
            itemTitle: verdict.itemTitle,
            destination: verdict.destination,
            feedback: nextFeedback,
            source: verdict.citation.includes("Gemini") ? "gemini" : "rules",
          }),
        });
      } catch {
        // Non-blocking telemetry
      }
    }
  }

  async function lookupItem(rawItem: string) {
    const trimmed = rawItem.trim();
    if (!trimmed) return;

    setVerdict(null);
    setFeedback(null);
    setCopied(false);
    setQuotaHit(false);
    setIsLoading(true);

    let resolvedVerdict: SortingVerdict | null = null;
    try {
      const res = await fetch(`/api/sort?q=${encodeURIComponent(trimmed)}`);
      if (res.ok) {
        const data = (await res.json()) as {
          verdict?: SortingVerdict;
          quotaExceeded?: boolean;
        };
        if (data.verdict) {
          resolvedVerdict = data.verdict;
        }
        if (data.quotaExceeded) {
          setQuotaHit(true);
        }
      }
      if (!resolvedVerdict) {
        resolvedVerdict = classifyWasteItem(trimmed);
      }
    } catch {
      resolvedVerdict = classifyWasteItem(trimmed);
    } finally {
      setVerdict(resolvedVerdict);
      setIsLoading(false);
      if (resolvedVerdict) {
        trackWasteAdvisorQueried(trimmed, resolvedVerdict.destination);
      }
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isLoading || !query.trim()) return;
    void lookupItem(query);
  }

  function handleCopy() {
    if (!verdict) return;
    const textToCopy = `Waste Sorting Guide: ${verdict.itemTitle} goes in the ${verdict.binLabel}.\nWhy: ${getQuickWhy(
      verdict
    )}\nSource: ${verdict.citation}`;

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      })
      .catch(() => {});
  }

  const situationalOptions = verdict ? getSituationalOptions(verdict) : null;
  const isSituational = situationalOptions !== null;
  const destConfig = verdict ? DESTINATION_STYLES[verdict.destination] : null;
  const DestIcon = destConfig?.icon ?? Recycle;
  const quickWhy = verdict ? getQuickWhy(verdict) : "";
  const actionableSteps = verdict ? getActionableSteps(verdict) : [];
  const conditionalPivot = verdict && !isSituational ? getConditionalPivot(verdict) : null;

  return (
    <section
      aria-label="Waste sorting guide"
      className="relative flex flex-col justify-between h-full space-y-4 rounded-3xl border-2 border-flip-sky/30 bg-white p-5 sm:p-6 shadow-xs"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 border-b-2 border-dashed border-flip-sky/25 pb-3">
        <div className="space-y-0.5 min-w-0">
          <h2 className="text-base sm:text-lg font-black tracking-tight text-flip-dark">
            Bin Sorter
          </h2>
          <div className="text-xs text-flip-slate font-bold truncate">
            San Diego Curbside &amp; Facility Sorting Guide
          </div>
        </div>
      </div>

      {/* Body with Search & Suggestion Chips */}
      <div className="flex-1 flex flex-col justify-between space-y-4 pt-1">
        {/* Search Input Bar */}
        <form onSubmit={handleSubmit} className="space-y-1.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              name="waste-search"
              id="waste-search-input"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-1p-ignore="true"
              data-lpignore="true"
              data-bwignore="true"
              data-dashlane-ignore="true"
              data-protonpass-ignore="true"
              data-form-type="other"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                if (verdict) setVerdict(null);
              }}
              placeholder="e.g., foil with melted cheese"
              aria-label="Check which bin an item belongs in"
              className="h-12 w-full rounded-full border-2 border-flip-teal/30 bg-white pl-4 pr-10 text-sm font-semibold text-flip-dark placeholder:text-flip-slate/60 focus:border-flip-teal focus:ring-4 focus:ring-flip-teal/20 focus:outline-hidden"
            />
            {query && (
              <button
                type="button"
                aria-label="Clear item search"
                onClick={() => {
                  setQuery("");
                  setVerdict(null);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-flip-slate/60 hover:bg-flip-teal/15 hover:text-flip-dark focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-flip-teal"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            )}
          </div>
          <button
            type="submit"
            aria-label="Search waste rules"
            className={`inline-flex h-12 shrink-0 items-center justify-center gap-1.5 rounded-full bg-gradient-to-b from-flip-gold to-flip-goldDark px-5 text-xs font-black text-flip-dark shadow-flip-gold-glow transition-all active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-flip-teal ${
              isLoading || !query.trim()
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:brightness-105"
            }`}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin text-current" />
            ) : (
              <Search className="h-4 w-4 text-current" />
            )}
            <span>Search</span>
          </button>
        </div>
      </form>

      {/* Suggestion Chips */}
      <div className="flex flex-wrap gap-2.5" role="group" aria-label="Common item shortcuts">
          {QUICK_DILEMMAS.map((chip) => {
            const isSelected =
              query.trim().toLowerCase() === chip.toLowerCase() && verdict !== null;
            return (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setQuery(chip);
                  void lookupItem(chip);
                }}
                className={`group inline-flex items-center gap-1.5 cursor-pointer rounded-full px-3.5 py-1.5 text-xs font-black transition-all duration-150 active:scale-95 hover:-translate-y-0.5 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-flip-teal ${
                  isSelected
                    ? "border-2 border-flip-teal bg-flip-teal text-white shadow-flip-teal-glow"
                    : "border-2 border-flip-teal/25 bg-white text-flip-tealDark hover:border-flip-teal hover:bg-flip-teal hover:text-white hover:shadow-flip-teal-glow shadow-xs"
                }`}
              >
                <span>{chip}</span>
              </button>
            );
          })}
        </div>

      {/* Simplified, Calm Loading State */}
      {isLoading && (
        <div
          role="status"
          aria-live="polite"
          className="flex items-center gap-3 rounded-2xl border-2 border-flip-teal/20 bg-white p-4 shadow-xs"
        >
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-flip-teal" />
          <span className="text-xs font-bold text-flip-dark">
            Checking City of San Diego curbside sorting rules…
          </span>
        </div>
      )}

      {/* AI Credits Exhausted Notification */}
      {quotaHit && !isLoading && (
        <div className="flex items-start gap-2.5 rounded-2xl border-2 border-amber-300 bg-amber-50 p-3.5 text-xs text-amber-900">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
          <div>
            <strong className="text-amber-950 font-bold">Daily AI Queries Exhausted:</strong>{" "}
            Live AI responses are temporarily paused. Serving official answers directly from City of San Diego resources.
          </div>
        </div>
      )}

      {/* Persistent live region so screen readers announce verdicts when received */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {verdict && destConfig
          ? `Verdict for ${verdict.itemTitle}: belongs in ${verdict.binLabel}`
          : ""}
      </div>

      {/* Structured Verdict Card */}
      {verdict && destConfig && (
        <div
          role="region"
          aria-label="Waste sorting verdict"
          className="space-y-4 rounded-3xl border-2 border-flip-teal/20 bg-white p-5 shadow-xs"
        >
          {/* 1. Primary Verdict Banner */}
          {isSituational ? (
            /* Situational Banner: Clean card, clear split */
            <div className="space-y-3 rounded-2xl border-2 border-amber-400/40 bg-white p-4 sm:p-4.5 shadow-xs">
              <div className="space-y-1">
                <span className="inline-block rounded-full bg-amber-100 border border-amber-300 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-900 shadow-2xs">
                  Situational · Depends on Material
                </span>
                <h3 className="text-base sm:text-lg font-black text-flip-dark leading-snug break-words">
                  {verdict.itemTitle}
                </h3>
              </div>

              {/* Split Outcome Tiles */}
              <div className="flex flex-col gap-2 pt-1">
                {situationalOptions.map((opt, i) => {
                  const optConfig = DESTINATION_STYLES[opt.destination];
                  const OptIcon = optConfig?.icon ?? Recycle;

                  return (
                    <div
                      key={i}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 rounded-xl border border-flip-teal/20 bg-white p-3 shadow-2xs"
                    >
                      {/* Left: Condition description */}
                      <div className="text-xs sm:text-sm font-black text-flip-dark">
                        {opt.condition}
                      </div>

                      {/* Right: Cart badge mirroring schedule row styling */}
                      <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
                        <span
                          className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-xl shadow-xs ${
                            optConfig?.iconClass ?? "bg-zinc-800 text-white border border-zinc-900"
                          }`}
                        >
                          <OptIcon className="h-3.5 w-3.5" aria-hidden="true" />
                        </span>
                        <span
                          className={`text-xs font-black tracking-tight ${
                            optConfig?.accentColor ?? "text-flip-dark"
                          }`}
                        >
                          {opt.badge}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Single-Destination Banner: Matching simple icon + cart styling */
            <div
              className={`flex items-start gap-3.5 rounded-2xl p-4 sm:p-4.5 border-2 shadow-xs ${destConfig.cardClass}`}
            >
              <span
                className={`flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-xl shadow-xs ${destConfig.iconClass}`}
              >
                <DestIcon className="h-4.5 w-4.5 sm:h-5 sm:w-5 text-white" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider shadow-2xs ${destConfig.badgeClass}`}
                >
                  {verdict.binLabel}
                </span>
                <h3 className="text-base sm:text-lg font-black text-flip-dark leading-snug break-words">
                  {verdict.itemTitle}
                </h3>
              </div>
            </div>
          )}

          {/* 2. Quick Why (1 Sentence) */}
          <div className="space-y-1 rounded-2xl bg-white p-4 border-2 border-flip-teal/15 shadow-xs">
            <h4 className="text-[10px] font-black uppercase tracking-wider text-flip-tealDark">
              {isSituational ? "Why the Condition Matters" : "Why This Cart"}
            </h4>
            <p className="text-xs leading-relaxed text-flip-dark font-medium">
              {quickWhy}
            </p>
          </div>

          {/* 3. Actionable Preparation Steps */}
          {actionableSteps.length > 0 && (
            <div className="space-y-2 rounded-2xl bg-white p-4 border-2 border-flip-teal/15 shadow-xs">
              <h4 className="text-[10px] font-black uppercase tracking-wider text-flip-tealDark">
                Actionable Steps
              </h4>
              <ol className="space-y-2 text-xs text-flip-dark font-medium">
                {actionableSteps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mt-0.5">
                      <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </span>
                    <span className="leading-snug">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* 4. The "Conditional Pivot" Box (Only for single-destination items that have conditional nuance) */}
          {conditionalPivot && (
            <div className="rounded-2xl border-2 border-flip-sky bg-sky-50/90 p-4 shadow-xs space-y-1.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-black text-sky-900">
                  <HelpCircle className="h-4 w-4 text-sky-600" aria-hidden="true" />
                  <span>Can It Go in Another Bin?</span>
                </div>
                <span className="inline-flex items-center rounded-full bg-sky-100 px-2.5 py-0.5 text-[11px] font-bold text-sky-800 border border-sky-300">
                  {conditionalPivot.alternateLabel}
                </span>
              </div>
              <p className="text-xs leading-relaxed text-sky-950 font-medium">
                <strong className="text-sky-950 font-bold">{conditionalPivot.condition}:</strong>{" "}
                {conditionalPivot.advice}
              </p>
            </div>
          )}

          {/* 5. Contextual Handoff to Special Events Calendar */}
          {verdict.destination === "dropoff" && (
            <div className="flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border-2 border-flip-coral bg-rose-50/90 p-4 text-xs shadow-xs">
              <div className="space-y-0.5">
                <div className="font-black text-rose-900 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-flip-goldDark" />
                  <span>
                    {/mattress|furniture|couch|appliance|bulky/i.test(
                      `${verdict.query} ${verdict.itemTitle}`
                    )
                      ? "Miramar Drop-Off & Facility Guidelines"
                      : "Next Local Hazardous Waste Drop-Off"}
                  </span>
                </div>
                <p className="text-[11px] text-rose-950 font-medium">
                  {/mattress/i.test(`${verdict.query} ${verdict.itemTitle}`)
                    ? "Drop off mattresses for free at the Miramar Recycling Center (5165 Convoy St · No appt needed)."
                    : /furniture|couch|appliance|bulky/i.test(
                        `${verdict.query} ${verdict.itemTitle}`
                      )
                    ? "Curbside bulky pickup paused. Donate locally or self-haul to Miramar Landfill."
                    : /batter|bulb|motor oil/i.test(
                        `${verdict.query} ${verdict.itemTitle}`
                      )
                    ? "Accepted at Saturday pop-up events (no appointment) or Miramar Facility."
                    : "Appointment required at the Miramar Hazardous Waste Facility (Wed & Sat)."}
                </p>
              </div>

              <a
                href="#special-events-calendar"
                onClick={() => {
                  const cat: EventCategoryFilter = /mattress|furniture|couch|appliance|bulky/i.test(
                    `${verdict.query} ${verdict.itemTitle}`
                  )
                    ? "mattresses_bulky"
                    : /batter|bulb|motor oil/i.test(
                        `${verdict.query} ${verdict.itemTitle}`
                      )
                    ? "batteries_bulbs_oil"
                    : /e-?waste|electronics|phone|laptop|tv|computer/i.test(
                        `${verdict.query} ${verdict.itemTitle}`
                      )
                    ? "electronics"
                    : "paint_chemicals";
                  onSelectSpecialCategory?.(cat);
                }}
                className="inline-flex items-center gap-1 rounded-full bg-flip-gold px-3.5 py-1.5 text-xs font-black text-flip-dark hover:brightness-105 transition-all shadow-xs active:scale-95"
              >
                <span>View Drop-Off Details</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </a>
            </div>
          )}

          {/* 6. AI Feedback & Micro-Interactions Metadata Row */}
          <div className="space-y-3 pt-3 border-t-2 border-dashed border-flip-teal/20 text-xs">
            {/* Source on its own line above */}
            <div className="text-[11px] font-semibold text-flip-slate leading-relaxed break-words">
              Source: {verdict.citation}
            </div>

            {/* Actions: Thumbs Up / Down & Copy Advice */}
            <div className="flex items-center justify-between gap-3 pt-1">
              {/* Thumbs Up / Down */}
              <div className="flex items-center gap-1 rounded-full border-2 border-flip-teal/20 bg-white p-1 shadow-xs">
                <button
                  type="button"
                  onClick={() => handleFeedbackClick("up")}
                  aria-label="Helpful advice"
                  title="Helpful advice"
                  className={`rounded-full p-1.5 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-flip-teal ${
                    feedback === "up"
                      ? "bg-emerald-100 text-emerald-800 font-bold"
                      : "text-flip-slate hover:text-flip-dark hover:bg-flip-tealBG"
                  }`}
                >
                  <ThumbsUp className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleFeedbackClick("down")}
                  aria-label="Not helpful advice"
                  title="Not helpful advice"
                  className={`rounded-full p-1.5 transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-flip-teal ${
                    feedback === "down"
                      ? "bg-rose-100 text-rose-800 font-bold"
                      : "text-flip-slate hover:text-flip-dark hover:bg-flip-tealBG"
                  }`}
                >
                  <ThumbsDown className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Copy Advice Button */}
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-full border-2 border-flip-teal/20 bg-white px-3 py-1.5 text-[11px] font-bold text-flip-tealDark hover:bg-flip-tealBG transition-all shadow-xs active:scale-95"
              >
                {copied ? (
                  <>
                    <Check className="h-3.5 w-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-extrabold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3.5 w-3.5" />
                    <span>Copy Advice</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </section>
  );
}
