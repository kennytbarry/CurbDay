"use client";

import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  ExternalLink,
  MapPin,
  X,
} from "lucide-react";
import {
  FALLBACK_EVENTS_DATA,
  generateIcsForSpecialEvent,
  type EventCategoryFilter,
  type SpecialEvent,
  type SpecialEventsData,
} from "@/lib/specialEvents";
import { trackHhwEventSaved } from "@/lib/analytics";

interface SpecialEventsCalendarProps {
  initialData?: SpecialEventsData;
  activeCategory?: EventCategoryFilter;
  onCategoryChange?: (category: EventCategoryFilter) => void;
}

function getRelativeDaysText(eventDateStr: string): string {
  const [y, m, d] = eventDateStr.split("-").map(Number);
  const eventDate = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffTime = eventDate.getTime() - today.getTime();
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0 || diffDays > 14) return "";
  if (diffDays === 0) return "Today!";
  if (diffDays === 1) return "Tomorrow";
  return `In ${diffDays} days`;
}

let clientEventsCache: SpecialEventsData | null = null;

export default function SpecialEventsCalendar({
  initialData = FALLBACK_EVENTS_DATA,
}: SpecialEventsCalendarProps) {
  const [downloadedEventId, setDownloadedEventId] = useState<string | null>(null);
  const [activeEventIndex, setActiveEventIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  function scrollCarousel(direction: "prev" | "next") {
    const container = carouselRef.current;
    if (!container) return;
    const card = container.querySelector("[data-event-card]") as HTMLElement | null;
    const cardWidth = card ? card.offsetWidth + 14 : 320;
    container.scrollBy({
      left: direction === "next" ? cardWidth : -cardWidth,
      behavior: "smooth",
    });
  }

  function scrollToIndex(idx: number) {
    const container = carouselRef.current;
    if (!container) return;
    const cards = container.querySelectorAll("[data-event-card]");
    const targetCard = cards[idx] as HTMLElement | undefined;
    if (targetCard) {
      targetCard.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "start",
      });
    }
  }

  function handleCarouselScroll() {
    const container = carouselRef.current;
    if (!container) return;
    const scrollLeft = container.scrollLeft;
    const card = container.querySelector("[data-event-card]") as HTMLElement | null;
    const cardWidth = card ? card.offsetWidth + 14 : 320;
    const idx = Math.round(scrollLeft / cardWidth);
    setActiveEventIndex(Math.min(Math.max(idx, 0), eventsData.upcomingEvents.length - 1));
  }

  function downloadIcs(event: SpecialEvent) {
    const icsContent = generateIcsForSpecialEvent(event);
    const blob = new Blob([icsContent], {
      type: "text/calendar;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `san-diego-dropoff-${event.date}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadedEventId(event.id);
    trackHhwEventSaved(event.id, event.venueName);
    setTimeout(() => setDownloadedEventId(null), 2500);
  }

  const [eventsData, setEventsData] = useState<SpecialEventsData>(
    clientEventsCache ?? initialData
  );

  useEffect(() => {
    if (clientEventsCache) return;
    let isMounted = true;
    fetch("/api/special-events")
      .then((res) => (res.ok ? res.json() : null))
      .then((json: SpecialEventsData | null) => {
        if (json && Array.isArray(json.upcomingEvents)) {
          clientEventsCache = json;
          if (isMounted) {
            setEventsData(json);
          }
        }
      })
      .catch(() => {
        // Fallback data remains active
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const upcomingEvents = eventsData.upcomingEvents;

  return (
    <div
      id="special-events-calendar"
      className="space-y-4"
    >
      {/* Tab Header */}
      <div className="border-b-2 border-dashed border-flip-sky/25 pb-2.5">
        <h2 className="text-base sm:text-lg font-black tracking-tight text-flip-dark">
          Free Hazardous &amp; Bulky Waste Dropoff
        </h2>
      </div>

      {/* 2-Column Responsive Layout: Left is One-Day, Right is Miramar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-start">
        {/* COLUMN 1 (LEFT): Saturday One-Day Collection Events */}
        <section
          aria-label="One-day collection events"
          className="relative space-y-4 rounded-3xl border-2 border-flip-sky/30 bg-white p-5 sm:p-6 shadow-xs"
        >
          {/* Section Header */}
          <div className="flex items-center justify-between gap-2 border-b-2 border-dashed border-flip-sky/25 pb-3">
            <h3 className="text-base sm:text-lg font-black tracking-tight text-flip-dark min-w-0">
              One-Day Collection Events
            </h3>
            <a
              href="https://www.sandiego.gov/environmental-services/ep/events/one-day"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-bold text-flip-tealDark hover:text-flip-teal hover:underline transition-colors shrink-0"
              title="City of San Diego One-Day Events website"
            >
              <span>City Info</span>
              <ExternalLink className="h-3 w-3 opacity-70" aria-hidden="true" />
              <span className="sr-only"> (opens in new tab)</span>
            </a>
          </div>

          {/* Materials Guide: Vertically Stacked Accepted & Not Accepted */}
          <div className="space-y-2.5">
            {/* Accepted items */}
          <div className="rounded-xl border-2 border-emerald-600/25 bg-emerald-50/90 p-3 space-y-1.5">
            <div className="font-black text-emerald-800 flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
              <span>Accepted</span>
            </div>
            <ul className="text-emerald-950 flex flex-col gap-1.5 text-xs font-medium">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 shrink-0 font-bold">•</span>
                <span><strong>Household Batteries:</strong> AA, AAA, 9V, Li-ion</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 shrink-0 font-bold">•</span>
                <span><strong>Car Batteries:</strong> Lead-acid (up to 2)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 shrink-0 font-bold">•</span>
                <span><strong>Bulbs:</strong> Fluorescent tubes up to 8ft, CFLs</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 shrink-0 font-bold">•</span>
                <span><strong>Motor Oil & Filters:</strong> Up to 5 gal</span>
              </li>
            </ul>
          </div>

          {/* Not Accepted items */}
          <div className="rounded-xl border-2 border-rose-500/25 bg-rose-50/90 p-3 space-y-1">
            <div className="font-black text-rose-800 flex items-center gap-1.5 text-xs uppercase tracking-wide">
              <X className="h-3.5 w-3.5 shrink-0 text-rose-600" />
              <span>Not Accepted</span>
            </div>
            <p className="text-rose-950 text-xs leading-relaxed font-medium">
              No paint, stains, solvents, chemicals, electronics, appliances, or mattresses.
            </p>
          </div>
        </div>

        {/* Upcoming Events Carousel */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-0.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-flip-tealDark">
                Upcoming Events
              </h4>
              <div>
                <span className="rounded-full bg-flip-tealBG border border-flip-teal/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-flip-tealDark">
                  No Appointment Needed
                </span>
              </div>
            </div>

            {/* Carousel Controls: Arrows and Counter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[11px] font-bold text-flip-slate mr-1">
                {activeEventIndex + 1} of {upcomingEvents.length}
              </span>
              <button
                type="button"
                onClick={() => scrollCarousel("prev")}
                disabled={activeEventIndex === 0}
                aria-label="Previous pop-up event"
                className="rounded-full border-2 border-flip-teal/20 bg-white p-1.5 text-flip-tealDark hover:bg-flip-teal hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-xs"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => scrollCarousel("next")}
                disabled={activeEventIndex === upcomingEvents.length - 1}
                aria-label="Next pop-up event"
                className="rounded-full border-2 border-flip-teal/20 bg-white p-1.5 text-flip-tealDark hover:bg-flip-teal hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors shadow-xs"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Carousel Snap Track (Full-width cards, focused on arrow navigation) */}
          <div
            ref={carouselRef}
            onScroll={handleCarouselScroll}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth touch-pan-x py-1 px-0.5 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
            style={{
              WebkitOverflowScrolling: "touch",
            }}
            role="region"
            aria-label="Upcoming pop-up events carousel"
          >
            {upcomingEvents.map((event, idx) => {
              const isNearest = idx === 0;
              const relativeText = getRelativeDaysText(event.date);

              return (
                <div
                  key={event.id}
                  data-event-card="true"
                  className={`relative w-full shrink-0 snap-start space-y-3.5 rounded-2xl border-2 p-4 sm:p-5 flex flex-col justify-between transition-all bg-white shadow-xs ${
                    isNearest
                      ? "border-flip-sky shadow-md"
                      : "border-flip-sky/25"
                  }`}
                >
                  <div className="space-y-3">
                    {/* Event Header */}
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-xs font-black text-flip-dark">
                          {event.displayDate}
                        </span>
                        {isNearest && relativeText && (
                          <span className="text-[11px] sm:text-xs font-extrabold text-flip-tealDark bg-flip-tealBG border border-flip-teal/30 px-2.5 py-0.5 rounded-full shadow-xs shrink-0">
                            {relativeText}
                          </span>
                        )}
                      </div>
                      <h5 className="text-sm font-extrabold text-flip-dark leading-snug">
                        {event.venueName}
                      </h5>
                    </div>

                    {/* Event Time & Clickable Location */}
                    <div className="space-y-2 text-xs font-medium">
                      <div className="flex items-center gap-2 text-flip-slate">
                        <Clock className="h-4 w-4 shrink-0 text-flip-teal" aria-hidden="true" />
                        <span>{event.startTime} – {event.endTime}</span>
                      </div>

                      <a
                        href={`https://maps.google.com/?q=${encodeURIComponent(
                          `${event.venueName} ${event.streetAddress}`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title="Open in Google Maps"
                        className="group flex items-start gap-2 text-flip-tealDark hover:text-flip-teal hover:underline transition-colors"
                      >
                        <MapPin className="h-4 w-4 shrink-0 text-flip-coral mt-0.5" aria-hidden="true" />
                        <span className="leading-snug font-semibold">
                          {event.streetAddress}
                        </span>
                        <ExternalLink className="h-3 w-3 shrink-0 opacity-60 mt-0.5" aria-hidden="true" />
                      </a>
                    </div>
                  </div>

                  {/* Action Button: Download .ics */}
                  <div className="pt-2 border-t-2 border-dashed border-flip-sky/25 flex items-center justify-start">
                    <button
                      type="button"
                      onClick={() => downloadIcs(event)}
                      className="inline-flex items-center gap-1.5 rounded-full border-2 border-flip-teal/25 bg-white hover:bg-flip-teal hover:text-white px-3.5 py-1.5 text-xs font-bold text-flip-tealDark transition-all active:scale-95 shadow-xs"
                    >
                      {downloadedEventId === event.id ? (
                        <>
                          <Check className="h-3.5 w-3.5 text-emerald-600" />
                          <span className="text-emerald-700 font-extrabold">Event Saved!</span>
                        </>
                      ) : (
                        <>
                          <Calendar className="h-3.5 w-3.5 text-flip-goldDark" />
                          <span>Add Event (.ics)</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Carousel Dot Indicators - Minimum 24x24px target size per WCAG 2.5.8 */}
          <div className="flex items-center justify-center gap-1 pt-1">
            {upcomingEvents.map((ev, idx) => (
              <button
                key={ev.id}
                type="button"
                onClick={() => scrollToIndex(idx)}
                aria-label={`Go to event ${idx + 1}: ${ev.venueName}`}
                className="flex h-6 w-6 items-center justify-center rounded-full cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-flip-teal"
              >
                <span
                  className={`h-2 rounded-full transition-all ${
                    idx === activeEventIndex
                      ? "w-6 bg-flip-teal shadow-xs"
                      : "w-2 bg-flip-teal/25 hover:bg-flip-teal/50"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>
      </section>

        {/* COLUMN 2 (RIGHT): Miramar Landfill Permanent Facilities */}
        <section
          aria-label="Miramar Landfill permanent drop-off facilities"
          className="relative space-y-4 rounded-3xl border-2 border-flip-sky/30 bg-white p-5 sm:p-6 shadow-xs"
        >
          {/* Section Header */}
          <div className="border-b-2 border-dashed border-flip-sky/25 pb-3">
            <h3 className="text-base sm:text-lg font-black tracking-tight text-flip-dark">
              Miramar Landfill
            </h3>
          </div>

          <div className="space-y-4">
            {/* Facility 1: Miramar Hazardous Waste Transfer Facility */}
            <div className="space-y-3.5 rounded-2xl border border-flip-sky/25 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                {/* Facility Header */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="rounded-full bg-flip-coralDark text-white px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider shadow-xs">
                      Appointment Required
                    </span>
                    <a
                      href="https://www.sandiego.gov/environmental-services/ep/hazardous"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-flip-tealDark hover:text-flip-teal hover:underline transition-colors shrink-0"
                    >
                      <span>City Facility Page</span>
                      <ExternalLink className="h-3 w-3 opacity-70" aria-hidden="true" />
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                  </div>
                  <h4 className="text-sm font-black text-flip-dark leading-snug">
                    Miramar Hazardous Waste Transfer Facility
                  </h4>
                </div>

                {/* Hours & Address */}
                <div className="space-y-2 text-xs font-medium">
                  <div className="flex items-center gap-2 text-flip-slate">
                    <Clock className="h-4 w-4 shrink-0 text-flip-teal" aria-hidden="true" />
                    <span>Wed & Sat, 9:00 AM – 3:00 PM</span>
                  </div>

                  <a
                    href="https://maps.google.com/?q=5161+Convoy+St+San+Diego+CA+92111"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in Google Maps"
                    className="group flex items-start gap-2 text-flip-tealDark hover:text-flip-teal hover:underline transition-colors"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-flip-coral mt-0.5" aria-hidden="true" />
                    <span className="leading-snug font-semibold">
                      5161 Convoy St, San Diego, CA 92111
                    </span>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-60 mt-0.5" aria-hidden="true" />
                  </a>
                </div>

                <p className="text-xs leading-relaxed text-flip-dark font-medium">
                  For items that pop-ups cannot take: <strong>paint, stains, household cleaners, bleach, pesticides, pool chemicals, batteries, and sharps</strong>.
                </p>

                {/* Legal Transport Limit Callout */}
                <div className="rounded-xl border border-amber-300 bg-amber-50 p-2.5 sm:p-3 space-y-1 text-xs">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 shrink-0 text-amber-600" />
                    <span>California Legal Transport Limit</span>
                  </div>
                  <p className="text-[11px] text-amber-950 leading-snug font-medium">
                    Max 15 gallons of liquid or 125 lbs total per trip (containers must not exceed 5 gallons). Residents stay in vehicle while staff unloads from trunk.
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t-2 border-dashed border-flip-sky/25 flex flex-wrap items-center gap-2">
                <a
                  href="https://getitdone.sandiego.gov/HazmatNewReportPage"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-b from-flip-gold to-flip-goldDark px-4 py-2 text-xs font-black text-flip-dark shadow-flip-gold-glow hover:brightness-105 transition-all active:scale-95"
                >
                  <span>Book Appointment Now</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                  <span className="sr-only"> (opens in new tab)</span>
                </a>
              </div>
            </div>

            {/* Facility 2: Miramar Recycling Center & Greenery */}
            <div className="space-y-3.5 rounded-2xl border border-flip-sky/25 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between">
              <div className="space-y-3">
                {/* Facility Header */}
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center justify-between gap-1.5">
                    <span className="rounded-full bg-flip-tealBG border border-flip-teal/30 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-flip-tealDark">
                      No Appointment Needed
                    </span>
                    <a
                      href="https://www.sandiego.gov/environmental-services/miramar"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-flip-tealDark hover:text-flip-teal hover:underline transition-colors shrink-0"
                    >
                      <span>City Facility Page</span>
                      <ExternalLink className="h-3 w-3 opacity-70" aria-hidden="true" />
                      <span className="sr-only"> (opens in new tab)</span>
                    </a>
                  </div>
                  <h4 className="text-sm font-black text-flip-dark leading-snug">
                    Miramar Recycling Center & Greenery
                  </h4>
                </div>

                {/* Hours & Address */}
                <div className="space-y-2 text-xs font-medium">
                  <div className="flex items-center gap-2 text-flip-slate">
                    <Clock className="h-4 w-4 shrink-0 text-flip-teal" aria-hidden="true" />
                    <span>Mon – Sat, 7:00 AM – 4:00 PM</span>
                  </div>

                  <a
                    href="https://maps.google.com/?q=5165+Convoy+St+San+Diego+CA+92111"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Open in Google Maps"
                    className="group flex items-start gap-2 text-flip-tealDark hover:text-flip-teal hover:underline transition-colors"
                  >
                    <MapPin className="h-4 w-4 shrink-0 text-flip-coral mt-0.5" aria-hidden="true" />
                    <span className="leading-snug font-semibold">
                      5165 Convoy St, San Diego, CA 92111
                    </span>
                    <ExternalLink className="h-3 w-3 shrink-0 opacity-60 mt-0.5" aria-hidden="true" />
                  </a>
                </div>

                <p className="text-xs leading-relaxed text-flip-dark font-medium">
                  Adjacent to the hazardous waste facility. For <strong>TVs, computers, electronics, cardboard, and self-haul appliances</strong>.
                </p>

                {/* Mattress Free Drop-Off Banner */}
                <div className="rounded-xl border border-flip-sky/25 bg-white p-3 space-y-0.5 text-xs">
                  <div className="font-extrabold text-flip-dark">
                    Free Mattress & Box Spring Drop-Off
                  </div>
                  <p className="text-[11px] text-flip-slate leading-snug font-medium">
                    Mon – Fri, 7:00 AM – 3:00 PM (up to 4 units per visit via California Bye Bye Mattress partnership).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
