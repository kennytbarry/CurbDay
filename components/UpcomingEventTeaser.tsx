"use client";

import {
  Calendar,
  ChevronRight,
  Clock,
  MapPin,
} from "lucide-react";
import type { SpecialEvent } from "@/lib/specialEvents";

interface UpcomingEventTeaserProps {
  event: SpecialEvent;
  onExplore: () => void;
  now?: Date;
}

export default function UpcomingEventTeaser({
  event,
  onExplore,
  now = new Date(),
}: UpcomingEventTeaserProps) {
  // Calculate days remaining
  const [y, m, d] = event.date.split("-").map(Number);
  const eventDate = new Date(y, m - 1, d);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  eventDate.setHours(0, 0, 0, 0);

  const diffDays = Math.round(
    (eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Only show event teaser if it is within the next 30 days
  if (diffDays < 0 || diffDays > 30) return null;

  let countdownText = `In ${diffDays} days`;
  if (diffDays === 0) countdownText = "Today!";
  else if (diffDays === 1) countdownText = "Tomorrow";

  return (
    <section
      aria-labelledby="upcoming-event-title"
      className="relative flex flex-col justify-between h-full rounded-3xl border-2 border-flip-sky/30 bg-white p-5 sm:p-6 shadow-xs space-y-4"
    >
      {/* Header matching Street Sweeping card format */}
      <div className="flex items-start justify-between gap-3 border-b-2 border-dashed border-flip-sky/25 pb-3">
        <div className="space-y-0.5 min-w-0">
          <h2 id="upcoming-event-title" className="text-base sm:text-lg font-black tracking-tight text-flip-dark">
            Hazardous Waste
          </h2>
          <div className="text-xs text-flip-slate font-bold truncate">
            One-day collection event
          </div>
        </div>

        {diffDays <= 14 && (
          <div className="flex items-center shrink-0 pt-0.5">
            <span className="text-[11px] sm:text-xs font-extrabold text-flip-tealDark bg-flip-tealBG border border-flip-teal/30 px-2.5 py-0.5 rounded-full shadow-xs">
              {countdownText}
            </span>
          </div>
        )}
      </div>

      {/* Information Row - Container inside container matching Street Sweeping */}
      <div className="rounded-2xl border border-flip-sky/25 bg-white p-4 space-y-2">
        {/* Line 1: Date */}
        <div className="flex items-center gap-2 text-sm sm:text-base font-black text-flip-dark">
          <Calendar className="h-4.5 w-4.5 text-flip-goldDark shrink-0" aria-hidden="true" />
          <span>{event.displayDate}</span>
        </div>

        {/* Line 2: Time */}
        <div className="flex items-center gap-1.5 text-xs text-flip-slate font-medium">
          <Clock className="h-3.5 w-3.5 text-flip-teal shrink-0" aria-hidden="true" />
          <span>{event.startTime}–{event.endTime}</span>
        </div>

        {/* Line 3: Location */}
        <div className="flex items-center gap-1.5 text-xs text-flip-slate font-normal truncate">
          <MapPin className="h-3.5 w-3.5 text-flip-coral shrink-0" aria-hidden="true" />
          <span className="text-flip-dark/80 font-normal truncate">
            {event.venueName}
          </span>
        </div>
      </div>

      {/* Action Row matching Street Sweeping action row style */}
      <div className="flex items-center rounded-full border border-flip-sky/25 bg-white p-0.5 shadow-xs">
        <button
          type="button"
          onClick={onExplore}
          aria-label={`View details: Hazardous Waste event at ${event.venueName}`}
          className="group relative flex h-7.5 flex-1 items-center justify-center gap-1.5 rounded-full border border-transparent px-2 text-[11px] font-bold text-flip-coralDark transition-all duration-150 hover:bg-flip-coral/10 hover:text-flip-dark hover:shadow-xs active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-flip-teal cursor-pointer"
        >
          <span>Event Details &amp; Drop-off Rules</span>
          <ChevronRight className="h-3.5 w-3.5 text-flip-coral transition-transform shrink-0 group-hover:translate-x-0.5" />
        </button>
      </div>
    </section>
  );
}
