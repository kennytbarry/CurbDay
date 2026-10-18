"use client";

import { useEffect, useState } from "react";
import {
  Info,
  RotateCw,
  Sparkles,
  X,
  Zap,
} from "lucide-react";
import type { ModelUsageSnapshot } from "@/lib/telemetry";

interface ModelsUsageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function CircularProgress({
  percent,
  color = "#22C55E",
}: {
  percent: number;
  color?: string;
}) {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percent / 100) * circumference;

  return (
    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 40 40">
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="transparent"
          stroke="#1F2937"
          strokeWidth="3"
        />
        <circle
          cx="20"
          cy="20"
          r={radius}
          fill="transparent"
          stroke={color}
          strokeWidth="3.2"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
    </div>
  );
}

export default function ModelsUsageModal({
  isOpen,
  onClose,
}: ModelsUsageModalProps) {
  const [data, setData] = useState<ModelUsageSnapshot>({
    plan: "Google AI Pro",
    model: "Gemini 3.8 Flash",
    overagesEnabled: false,
    weeklyLimitPercent: 98,
    fiveHourLimitPercent: 97,
    totalRequests: 3,
    totalTokens: 3091,
    promptTokens: 2450,
    candidateTokens: 641,
    avgLatencyMs: 1620,
  });
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [overagesEnabled, setOveragesEnabled] = useState(false);

  async function handleManualRefresh() {
    setIsRefreshing(true);
    try {
      const res = await fetch("/api/usage");
      if (res.ok) {
        const snap = (await res.json()) as ModelUsageSnapshot;
        setData(snap);
      }
    } catch {
      // Keep state
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  }

  useEffect(() => {
    if (!isOpen) return;
    let ignore = false;

    fetch("/api/usage")
      .then((res) => (res.ok ? res.json() : null))
      .then((snap: ModelUsageSnapshot | null) => {
        if (!ignore && snap) {
          setData(snap);
        }
      })
      .catch(() => {});

    return () => {
      ignore = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="models-usage-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative max-h-[92vh] w-full max-w-[500px] overflow-y-auto rounded-3xl border border-white/15 bg-[#12141A] p-6 text-white shadow-2xl ring-1 ring-white/10"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute right-4 top-4 rounded-full p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Modal Header */}
        <div className="space-y-1 pr-8">
          <div className="flex items-center gap-2">
            <h2 id="models-usage-title" className="text-xl font-bold tracking-tight">
              Models & Usage
            </h2>
            <button
              type="button"
              onClick={() => void handleManualRefresh()}
              title="Refresh usage"
              className="rounded-full p-1 text-zinc-400 hover:text-white"
            >
              <RotateCw
                className={`h-4 w-4 ${isRefreshing ? "animate-spin text-cc-gold" : ""}`}
              />
            </button>
          </div>
          <p className="text-xs text-zinc-400">
            Manage your model quota and credits.
          </p>
        </div>

        <div className="mt-6 space-y-5">
          {/* Plan Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-300">Plan</h3>
            <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-[#1A1D24] p-4">
              <div className="space-y-1">
                <div className="text-sm font-bold text-white">
                  Your Plan: {data.plan}
                </div>
                <div className="text-xs text-zinc-400">
                  You can upgrade to a Google AI Ultra plan to receive higher rate limits.
                </div>
              </div>
              <button
                type="button"
                className="shrink-0 rounded-xl bg-[#0084FF] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#0073E6]"
              >
                Upgrade
              </button>
            </div>
          </div>

          {/* Model Credits Section */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-zinc-300">Model Credits</h3>
            <div className="rounded-2xl border border-white/10 bg-[#1A1D24] p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-white">
                  Enable AI Credit Overages
                </span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={overagesEnabled}
                  onClick={() => setOveragesEnabled(!overagesEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    overagesEnabled ? "bg-[#0084FF]" : "bg-zinc-700"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      overagesEnabled ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              <p className="mt-2 text-xs leading-relaxed text-zinc-400">
                When toggled on, CurbDay will use your AI credits to fulfill model requests once you&apos;re out of model quota. Antigravity will always use your model quota first before using AI credits.
              </p>
            </div>
          </div>

          {/* Gemini Models Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-semibold text-zinc-300">
                Gemini Models
              </h3>
              <Info className="h-3.5 w-3.5 text-zinc-500" />
            </div>

            <div className="space-y-2.5 rounded-2xl border border-white/10 bg-[#1A1D24] p-4">
              {/* Weekly Limit */}
              <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-3">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium text-white">
                    Weekly Limit Remaining
                  </div>
                  <div className="text-xs text-zinc-400">
                    You have used some of your weekly limit, it will fully refresh in 6 days, 7 hours.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tabular-nums">
                    {data.weeklyLimitPercent}%
                  </span>
                  <CircularProgress percent={data.weeklyLimitPercent} />
                </div>
              </div>

              {/* Five Hour Limit */}
              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="space-y-0.5">
                  <div className="text-sm font-medium text-white">
                    Five Hour Limit Remaining
                  </div>
                  <div className="text-xs text-zinc-400">
                    You have used some of your 5-hour limit, it will fully refresh in 54 minutes.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white tabular-nums">
                    {data.fiveHourLimitPercent}%
                  </span>
                  <CircularProgress percent={data.fiveHourLimitPercent} />
                </div>
              </div>
            </div>
          </div>

          {/* Live Sorting Telemetry */}
          <div className="space-y-2">
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-semibold text-zinc-300">
                Live Sorter Telemetry
              </h3>
              <Zap className="h-3.5 w-3.5 text-cc-gold" />
            </div>

            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-[#1A1D24] p-3 text-center">
              <div className="space-y-0.5">
                <div className="text-[10px] uppercase font-bold text-zinc-500">
                  Model
                </div>
                <div className="text-xs font-bold text-cc-gold truncate">
                  3.8 Flash
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] uppercase font-bold text-zinc-500">
                  Total Tokens
                </div>
                <div className="text-xs font-bold text-white tabular-nums">
                  {data.totalTokens.toLocaleString()}
                </div>
              </div>
              <div className="space-y-0.5">
                <div className="text-[10px] uppercase font-bold text-zinc-500">
                  Avg Latency
                </div>
                <div className="text-xs font-bold text-emerald-400 tabular-nums">
                  {data.avgLatencyMs}ms
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between rounded-xl bg-cc-navyMid/60 px-3 py-2 text-[11px] text-zinc-400">
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3 w-3 text-cc-gold" />
                ESD Local Rules Fallback
              </span>
              <span className="font-semibold text-emerald-400">100% Ready (0ms)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
