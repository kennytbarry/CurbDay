"use client";

import { useEffect, useState } from "react";
import { AlertCircle, Bell, Calendar, Clock, MapPin } from "lucide-react";
import type { StreetSweepingRecord } from "@/lib/streetSweeping";

interface StreetSweepingCardProps {
  address: string;
  onOpenReminders?: (data: StreetSweepingRecord) => void;
  onOpenCalendar?: (data: StreetSweepingRecord) => void;
}

function formatTitleCase(str: string): string {
  if (!str) return "";
  return str
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function StreetSweepingCard({
  address,
  onOpenReminders,
  onOpenCalendar,
}: StreetSweepingCardProps) {
  const [data, setData] = useState<StreetSweepingRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasQueried, setHasQueried] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    if (!address.trim()) {
      setData(null);
      return;
    }

    async function loadSweeping() {
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/street-sweeping?address=${encodeURIComponent(address)}`
        );
        if (res.ok) {
          const json = (await res.json()) as {
            found?: boolean;
            record?: StreetSweepingRecord;
          };
          if (!isCancelled && json.found && json.record) {
            setData(json.record);
          } else if (!isCancelled) {
            setData(null);
          }
        }
      } catch {
        if (!isCancelled) setData(null);
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
          setHasQueried(true);
        }
      }
    }

    void loadSweeping();
    return () => {
      isCancelled = true;
    };
  }, [address]);

  // Don't render anything if loading or if no sweeping route exists for this address
  if (isLoading || (!data && hasQueried) || !data) {
    return null;
  }

  const isToday = data.daysUntil === 0;
  const isTomorrow = data.daysUntil === 1;
  const daysText = isToday
    ? "Today"
    : isTomorrow
    ? "Tomorrow"
    : data.daysUntil <= 7
    ? `in ${data.daysUntil} days`
    : `in ${data.daysUntil} days`;

  return (
    <div
      role="region"
      aria-label="Street sweeping schedule"
      className="relative flex flex-col justify-between h-full rounded-3xl border-2 border-flip-sky/30 bg-white p-5 sm:p-6 shadow-xs space-y-4"
    >
      {/* Header: Title, Block, and Status Pills */}
      <div className="flex items-start justify-between gap-3 border-b-2 border-dashed border-flip-sky/25 pb-3">
        <div className="min-w-0 space-y-0.5">
          <h2 className="text-base sm:text-lg font-black text-flip-dark tracking-tight">
            Street Sweeping
          </h2>
          <div className="text-xs text-flip-slate font-bold truncate">
            {data.sides || `${formatTitleCase(data.street)} · ${data.blockRange}`}
          </div>
        </div>

        {/* Top-Right Badges: Status Pill + Enforced Pill */}
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          {data.isPosted && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-flip-coralDark text-white px-2.5 sm:px-3 py-1 text-xs font-black uppercase tracking-wider shadow-xs">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 text-white" />
              <span className="hidden sm:inline">
                Enforced · {data.timeWindow || "Posted Hours"}
              </span>
              <span className="sm:hidden">
                Enforced
              </span>
            </span>
          )}
          {data.daysUntil >= 0 && data.daysUntil <= 14 && (
            <span className="text-[11px] sm:text-xs font-extrabold text-flip-tealDark bg-flip-tealBG border border-flip-teal/30 px-2.5 py-0.5 rounded-full shadow-xs">
              {daysText}
            </span>
          )}
        </div>
      </div>

      {/* Information Row */}
      <div className="rounded-2xl border border-flip-sky/25 bg-white p-4 space-y-2">
        {/* Line 1: Date */}
        <div className="flex items-center gap-2 text-sm sm:text-base font-black text-flip-dark">
          <Calendar className="h-4.5 w-4.5 text-flip-goldDark shrink-0" />
          <span>{data.nextDateFormatted}</span>
        </div>

        {/* Line 2: Cadence / Schedule with Clock Icon */}
        <div className="flex items-center gap-1.5 text-xs text-flip-slate font-medium truncate">
          <Clock className="h-3.5 w-3.5 text-flip-teal shrink-0" aria-hidden="true" />
          <span>{data.frequency}</span>
        </div>

        {/* Line 3: Street & Block Range with GPS Pin Icon */}
        <div className="flex items-center gap-1.5 text-xs text-flip-slate font-normal truncate">
          <MapPin className="h-3.5 w-3.5 text-flip-coral shrink-0" aria-hidden="true" />
          <span className="text-flip-dark/80 font-normal truncate">
            {formatTitleCase(data.street)} · {data.blockRange}
          </span>
        </div>
      </div>

      {/* Action Row: Reminders & Calendar */}
      {(onOpenReminders || onOpenCalendar) && (
        <div className="flex items-center rounded-full border border-flip-sky/25 bg-white p-0.5 shadow-xs">
          {onOpenReminders && (
            <button
              type="button"
              onClick={() => onOpenReminders(data)}
              aria-label="Get street sweeping reminders"
              className="group relative flex h-7.5 flex-1 items-center justify-center gap-1.5 rounded-full border border-transparent px-2 text-[11px] font-bold text-flip-tealDark transition-all duration-150 hover:bg-white hover:text-flip-dark hover:shadow-xs active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-flip-teal cursor-pointer"
            >
              <Bell className="h-3 w-3 text-flip-teal transition-colors shrink-0 group-hover:scale-110" />
              <span className="truncate">Reminders</span>
            </button>
          )}

          {onOpenReminders && onOpenCalendar && (
            <div className="h-3.5 w-px bg-flip-sky/25" aria-hidden="true" />
          )}

          {onOpenCalendar && (
            <button
              type="button"
              onClick={() => onOpenCalendar(data)}
              aria-label="Add street sweeping to calendar"
              className="group relative flex h-7.5 flex-1 items-center justify-center gap-1.5 rounded-full border border-transparent px-2 text-[11px] font-bold text-flip-tealDark transition-all duration-150 hover:bg-white hover:text-flip-dark hover:shadow-xs active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-flip-teal cursor-pointer"
            >
              <Calendar className="h-3 w-3 text-flip-goldDark transition-colors shrink-0 group-hover:scale-110" />
              <span className="truncate">Calendar</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
