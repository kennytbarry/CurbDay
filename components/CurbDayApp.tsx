"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, Calendar, Check, ExternalLink, Loader2, MapPin, Share2, ShieldAlert, Truck } from "lucide-react";
import AddressSearch from "@/components/AddressSearch";
import BinStatusHero from "@/components/BinStatusHero";
import CalendarModal from "@/components/CalendarModal";
import SubscribeModal from "@/components/SubscribeModal";
import TrashTruckArtwork from "@/components/TrashTruckArtwork";
import WasteAdvisor from "@/components/WasteAdvisor";
import SpecialEventsCalendar from "@/components/SpecialEventsCalendar";
import UpcomingEventTeaser from "@/components/UpcomingEventTeaser";
import StreetSweepingCard from "@/components/StreetSweepingCard";
import type { StreetSweepingRecord } from "@/lib/streetSweeping";
import { trackAddressSearched } from "@/lib/analytics";
import { hydrateCollectionProfile } from "@/lib/arcgis";
import { extractStreetAddress } from "@/lib/esd";
import { parseDayNameToIndex } from "@/lib/holidays";
import { buildCollectionCalendar } from "@/lib/ics-generator";
import {
  FALLBACK_EVENTS_DATA,
  type EventCategoryFilter,
  type SpecialEventsData,
} from "@/lib/specialEvents";
import {
  formatCityDate,
  formatPickupMorning,
  getCollectionEvents,
  isRecyclingWeek,
  shortHolidayName,
  slugify,
  type CollectionProfile,
} from "@/lib/schedule";

export interface CurbDayAppProps {
  profiles: CollectionProfile[];
  now: Date;
  initialProfileId?: string;
  initialProfile?: CollectionProfile | null;
  initialSpecialEvents?: SpecialEventsData;
}

/** Enough look-ahead to always find the next recycling week. */
const LOOKAHEAD_WEEKS = 4;
const CALENDAR_WEEKS = 52;

type AppTab = "schedule" | "special_events";

function AppFooter() {
  return (
    <footer className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 pt-4 pb-2 text-center text-[11px] font-medium text-flip-slate">
      <span>Independent civic project; not an official City of San Diego ESD application.</span>
      <span className="hidden sm:inline text-flip-slate/50" aria-hidden="true">•</span>
      <div className="flex items-center gap-2 font-bold text-flip-tealDark">
        <Link
          href="/case-study"
          className="hover:text-flip-dark hover:underline transition-colors"
        >
          📖 Product Case Study
        </Link>
        <span className="text-flip-slate/50" aria-hidden="true">•</span>
        <a
          href="https://github.com/kennytbarry/CurbDay#readme"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 hover:text-flip-dark hover:underline transition-colors"
        >
          <span>💻 GitHub Repository</span>
          <ExternalLink className="h-3 w-3 opacity-60" aria-hidden="true" />
        </a>
      </div>
    </footer>
  );
}

export default function CurbDayApp({
  profiles,
  now,
  initialProfileId,
  initialProfile,
  initialSpecialEvents,
}: CurbDayAppProps) {
  const [activeTab, setActiveTab] = useState<AppTab>("schedule");
  const [specialCategory, setSpecialCategory] =
    useState<EventCategoryFilter>("all");
  const [isSubscribeOpen, setIsSubscribeOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [reminderMode, setReminderMode] =
    useState<"collection" | "street_sweeping">("collection");
  const [calendarMode, setCalendarMode] =
    useState<"collection" | "street_sweeping">("collection");
  const [sweepingData, setSweepingData] =
    useState<StreetSweepingRecord | null>(null);

  const [selectedProfile, setSelectedProfile] =
    useState<CollectionProfile | null>(() => {
      if (initialProfile) return initialProfile;
      if (initialProfileId) {
        const found = profiles.find((p) => p.id === initialProfileId);
        if (found) return found;
      }
      return null;
    });

  const [liveNow, setLiveNow] = useState<Date | null>(null);
  const [isScheduleLoading, setIsScheduleLoading] = useState(false);
  const [copiedBookmark, setCopiedBookmark] = useState(false);

  const activeNow = useMemo(() => {
    if (selectedProfile?.isLiveEsd && selectedProfile.esdNextDates?.refuse) {
      const today = liveNow ?? now;
      const refuseDate = new Date(selectedProfile.esdNextDates.refuse);
      return refuseDate < today ? refuseDate : today;
    }
    return liveNow ?? now;
  }, [selectedProfile, liveNow, now]);

  const scheduleView = useMemo(() => {
    if (!selectedProfile) return null;
    const events = getCollectionEvents(
      selectedProfile,
      activeNow,
      LOOKAHEAD_WEEKS
    );
    const [current, ...upcoming] = events;
    const nextRecycling = upcoming.find((e) => e.recycling);
    const holidayName =
      current.pickup.isDelayed && current.pickup.holidayName
        ? shortHolidayName(current.pickup.holidayName)
        : undefined;
    const slug = slugify(selectedProfile.address);

    return {
      current,
      upcoming,
      nextRecycling,
      holidayName,
      slug,
    };
  }, [selectedProfile, activeNow]);

  const nextSpecialEvent = useMemo(() => {
    const events = (initialSpecialEvents || FALLBACK_EVENTS_DATA).upcomingEvents;
    const current = liveNow ?? now;
    const todayStr = `${current.getFullYear()}-${String(
      current.getMonth() + 1
    ).padStart(2, "0")}-${String(current.getDate()).padStart(2, "0")}`;

    const futureEvents = events
      .filter((e) => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date));

    const candidate = futureEvents[0];
    if (!candidate) return null;

    // Calculate days until candidate event
    const [y, m, d] = candidate.date.split("-").map(Number);
    const candidateDate = new Date(y, m - 1, d);
    const today = new Date(current);
    today.setHours(0, 0, 0, 0);
    candidateDate.setHours(0, 0, 0, 0);

    const diffDays = Math.round(
      (candidateDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Only show teaser if event is within the next 30 days
    if (diffDays < 0 || diffDays > 30) {
      return null;
    }

    return candidate;
  }, [initialSpecialEvents, liveNow, now]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setLiveNow(new Date());
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const url = new URL(window.location.href);
    const addressParam = url.searchParams.get("address") || url.searchParams.get("q");
    if (!addressParam) return;

    if (selectedProfile) {
      const isAlreadyMatched =
        selectedProfile.address.toLowerCase() === addressParam.toLowerCase() ||
        extractStreetAddress(selectedProfile.address).toLowerCase() === addressParam.toLowerCase();
      if (isAlreadyMatched) return;
    }

    const matched = profiles.find(
      (p) =>
        p.address.toLowerCase() === addressParam.toLowerCase() ||
        extractStreetAddress(p.address).toLowerCase() === addressParam.toLowerCase() ||
        p.id.toLowerCase() === addressParam.toLowerCase() ||
        p.streetLabel.toLowerCase() === addressParam.toLowerCase()
    );
    if (matched) {
      setSelectedProfile(matched);
      return;
    }

    // Pull live schedule for bookmarked URL
    setIsScheduleLoading(true);
    fetch(`/api/schedule?address=${encodeURIComponent(addressParam)}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { profile?: CollectionProfile } | null) => {
        if (data?.profile) {
          setSelectedProfile(hydrateCollectionProfile(data.profile));
        }
      })
      .catch(() => {})
      .finally(() => setIsScheduleLoading(false));
  }, [profiles, selectedProfile]);

  function handleSelectProfile(nextProfile: CollectionProfile) {
    if (!liveNow) {
      setLiveNow(new Date());
    }
    setSelectedProfile(nextProfile);
    trackAddressSearched(nextProfile.address, "autocomplete");
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      const streetSlug = extractStreetAddress(nextProfile.address);
      url.searchParams.set("address", streetSlug);
      window.history.replaceState({}, "", url.toString());
    }
  }

  function handleClearAddress() {
    setSelectedProfile(null);
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.delete("address");
      url.searchParams.delete("q");
      url.searchParams.delete("id");
      window.history.replaceState({}, "", url.pathname);
    }
  }

  function handleCopyBookmark() {
    if (!selectedProfile || typeof window === "undefined") return;
    const url = new URL(window.location.origin + window.location.pathname);
    const streetSlug = extractStreetAddress(selectedProfile.address);
    url.searchParams.set("address", streetSlug);
    const bookmarkUrl = url.toString();
    window.history.replaceState({}, "", bookmarkUrl);

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard
        .writeText(bookmarkUrl)
        .then(() => {
          setCopiedBookmark(true);
          setTimeout(() => setCopiedBookmark(false), 2500);
        })
        .catch(() => {});
    }
  }

  // -----------------------------------------------------------------
  // INITIAL PAGE LOAD: Only show address entry modal-like card
  // -----------------------------------------------------------------
  if (!selectedProfile) {
    return (
      <main className="min-h-[75vh] flex flex-col items-center justify-center px-2 py-8 sm:py-16 animate-in fade-in duration-200">
        <div className="w-full max-w-lg space-y-6 rounded-3xl border-2 border-flip-teal/25 bg-white p-6 sm:p-8 shadow-xl shadow-flip-teal/10">
          {/* Flip7 Banner Badge & Truck Header */}
          <div className="flex items-center justify-between gap-3 border-b-2 border-dashed border-flip-teal/20 pb-5">
            <div className="space-y-1.5 text-left min-w-0">
              <div className="relative inline-flex -skew-x-6 -rotate-2 rounded-2xl border-2 border-flip-teal/30 bg-flip-cream px-3 sm:px-3.5 py-1 shadow-flip-card shrink-0">
                <h1 className="skew-x-6 inline-flex items-baseline gap-2 whitespace-nowrap">
                  <span className="text-xl sm:text-2xl font-black tracking-tight text-flip-tealDark [text-shadow:2px_2px_0_#FFD23F] whitespace-nowrap">
                    CurbDay
                  </span>
                  <span className="font-cursive -rotate-3 text-xl sm:text-2xl font-normal tracking-normal text-flip-coral drop-shadow-[1px_1px_0_#FFD23F] whitespace-nowrap">
                    San Diego
                  </span>
                </h1>
              </div>
              <p className="text-xs sm:text-sm font-extrabold tracking-wide text-flip-slate italic">
                “Wheels in, surf’s up”
              </p>
            </div>

            <TrashTruckArtwork
              mirrored
              className="h-[81px] w-[144px] sm:h-[94px] sm:w-[165px] shrink-0 opacity-95"
            />
          </div>

          {/* Address Search & Helper Text */}
          <div className="space-y-2">
            <AddressSearch
              profiles={profiles}
              selectedProfile={selectedProfile}
              onSelectProfile={handleSelectProfile}
              onScheduleLoadingChange={setIsScheduleLoading}
            />
            <p className="px-1 text-xs sm:text-sm font-medium text-flip-slate leading-relaxed text-center sm:text-left">
              Enter City of San Diego street address to view pickup and street sweeping schedule
            </p>
          </div>

          {isScheduleLoading && (
            <div className="flex items-center justify-center gap-2 pt-2 text-xs font-bold text-flip-tealDark animate-pulse">
              <Loader2 className="h-4 w-4 animate-spin text-flip-teal" />
              <span>Looking up collection & sweeping schedules…</span>
            </div>
          )}
        </div>

        <div className="w-full max-w-lg">
          <AppFooter />
        </div>
      </main>
    );
  }

  // -----------------------------------------------------------------
  // RESULTS PAGE LOAD: Two tabs & complete schedule results
  // -----------------------------------------------------------------
  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between gap-3 px-1">
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3.5">
          {/* Flip7 Card Game Header Badge: Cream parallelogram with bold teal & cursive San Diego */}
          <div className="relative -skew-x-6 -rotate-2 rounded-2xl border-2 border-flip-teal/30 bg-flip-cream px-4 py-1.5 shadow-flip-card flex items-center gap-2.5 shrink-0">
            <h1 className="skew-x-6 inline-flex items-baseline gap-2.5 whitespace-nowrap">
              <span className="text-2xl font-black tracking-tight text-flip-tealDark [text-shadow:2px_2px_0_#FFD23F] sm:text-[27px] whitespace-nowrap">
                CurbDay
              </span>
              <span className="font-cursive -rotate-3 text-2xl font-normal tracking-normal text-flip-coral drop-shadow-[1px_1px_0_#FFD23F] sm:text-[27px] whitespace-nowrap">
                San Diego
              </span>
            </h1>
          </div>

          {/* Simple Slogan Text Alongside */}
          <span className="text-xs sm:text-sm font-extrabold tracking-wide text-flip-slate italic">
            “Wheels in, surf’s up”
          </span>
        </div>

        <TrashTruckArtwork
          mirrored
          className="h-[85px] w-[150px] sm:h-[105px] sm:w-[185px] shrink-0 opacity-95"
        />
      </header>

      {/* Address Header & Change / Share Action Row above the tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-2.5 rounded-2xl border-2 border-flip-sky/30 bg-white p-3 sm:px-4 sm:py-2.5 shadow-xs">
        <div className="flex items-start sm:items-center gap-2 min-w-0 flex-1">
          <MapPin className="h-4 w-4 shrink-0 text-flip-coral mt-0.5 sm:mt-0" aria-hidden="true" />
          <span
            title={selectedProfile.address}
            className="text-xs sm:text-sm text-flip-slate font-medium leading-snug break-words"
          >
            Schedule for{" "}
            <strong className="text-flip-dark font-extrabold">
              {extractStreetAddress(selectedProfile.address)}
            </strong>
          </span>
        </div>
        <div className="flex items-center justify-end gap-2.5 shrink-0 self-end sm:self-auto">
          <button
            type="button"
            onClick={handleClearAddress}
            className="text-xs font-bold text-flip-slate hover:text-flip-dark underline cursor-pointer px-1"
          >
            Change
          </button>
          <button
            type="button"
            onClick={handleCopyBookmark}
            aria-label="Copy shareable link"
            className="inline-flex items-center gap-1.5 rounded-full border border-flip-teal/25 bg-white px-3 py-1 text-xs font-bold text-flip-tealDark shadow-xs hover:border-flip-teal hover:bg-slate-50 hover:text-flip-dark active:scale-95 transition-all cursor-pointer"
          >
            {copiedBookmark ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                <span className="text-emerald-700 font-bold">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="h-3 w-3 text-flip-teal shrink-0" />
                <span>Share</span>
              </>
            )}
          </button>
        </div>
        <div aria-live="polite" className="sr-only">
          {copiedBookmark ? "Shareable link copied to clipboard" : ""}
        </div>
      </div>

      {/* View Switcher: Curbside Collection vs. Hazardous & Bulky Drop-Offs */}
      <div
        role="tablist"
        aria-label="CurbDay sections"
        className="grid grid-cols-2 rounded-full bg-white p-1.5 border-2 border-flip-teal/20 shadow-xs"
        onKeyDown={(e) => {
          if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
            e.preventDefault();
            const nextTab = activeTab === "schedule" ? "special_events" : "schedule";
            setActiveTab(nextTab);
            const targetId = nextTab === "schedule" ? "tab-schedule" : "tab-special-events";
            document.getElementById(targetId)?.focus();
          }
        }}
      >
        <button
          role="tab"
          id="tab-schedule"
          aria-selected={activeTab === "schedule"}
          aria-controls="panel-schedule"
          tabIndex={activeTab === "schedule" ? 0 : -1}
          type="button"
          onClick={() => setActiveTab("schedule")}
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-full py-2.5 px-3 text-xs sm:text-sm font-extrabold transition-all duration-150 active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-flip-teal ${
            activeTab === "schedule"
              ? "bg-flip-teal text-flip-dark font-black shadow-flip-teal-glow"
              : "text-flip-slate hover:text-flip-dark hover:bg-flip-tealBG"
          }`}
        >
          <Truck className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Curbside & Sorter</span>
        </button>
        <button
          role="tab"
          id="tab-special-events"
          aria-selected={activeTab === "special_events"}
          aria-controls="panel-special-events"
          tabIndex={activeTab === "special_events" ? 0 : -1}
          type="button"
          onClick={() => setActiveTab("special_events")}
          className={`flex cursor-pointer items-center justify-center gap-2 rounded-full py-2.5 px-3 text-xs sm:text-sm font-extrabold transition-all duration-150 active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-flip-teal ${
            activeTab === "special_events"
              ? "bg-flip-teal text-flip-dark font-black shadow-flip-teal-glow"
              : "text-flip-slate hover:text-flip-dark hover:bg-flip-tealBG"
          }`}
        >
          <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Hazardous & Bulky</span>
        </button>
      </div>

      {activeTab === "schedule" ? (
        <div
          role="tabpanel"
          id="panel-schedule"
          aria-labelledby="tab-schedule"
          className="space-y-5"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 items-start">
            {/* Left Column: Curbside Collection & Street Sweeping */}
            <div className="flex flex-col gap-4 sm:gap-5">
              {scheduleView && (
                <div
                  aria-live="polite"
                  aria-busy={isScheduleLoading}
                  className={`flex flex-col transition-opacity duration-150 ${
                    isScheduleLoading ? "opacity-60" : "opacity-100"
                  }`}
                >
                  <BinStatusHero
                    address={selectedProfile.address}
                    pickupDate={formatPickupMorning(
                      scheduleView.current.pickup.actualDate
                    )}
                    trashDate={
                      selectedProfile.esdNextDates?.refuse
                        ? formatCityDate(new Date(selectedProfile.esdNextDates.refuse))
                        : formatCityDate(scheduleView.current.pickup.actualDate)
                    }
                    organicsDate={
                      selectedProfile.esdNextDates?.organics
                        ? formatCityDate(new Date(selectedProfile.esdNextDates.organics))
                        : formatCityDate(scheduleView.current.pickup.actualDate)
                    }
                    recyclingDate={
                      selectedProfile.esdNextDates?.recycle
                        ? formatCityDate(new Date(selectedProfile.esdNextDates.recycle))
                        : scheduleView.current.recycling
                        ? formatCityDate(scheduleView.current.pickup.actualDate)
                        : scheduleView.nextRecycling
                        ? formatCityDate(scheduleView.nextRecycling.pickup.actualDate)
                        : undefined
                    }
                    recyclingActive={scheduleView.current.recycling}
                    nextRecyclingDate={
                      selectedProfile.esdNextDates?.recycle
                        ? formatCityDate(new Date(selectedProfile.esdNextDates.recycle))
                        : scheduleView.nextRecycling
                        ? formatCityDate(scheduleView.nextRecycling.pickup.actualDate)
                        : undefined
                    }
                    holidayName={scheduleView.holidayName}
                    footer={
                      <div className="flex items-center rounded-full border border-flip-sky/25 bg-white p-0.5 shadow-xs">
                        <button
                          type="button"
                          onClick={() => {
                            setReminderMode("collection");
                            setIsSubscribeOpen(true);
                          }}
                          aria-label="Get weekly reminders"
                          className="group relative flex h-7.5 flex-1 items-center justify-center gap-1.5 rounded-full border border-transparent px-2 text-[11px] font-bold text-flip-tealDark transition-all duration-150 hover:bg-white hover:text-flip-dark hover:shadow-xs active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-flip-teal cursor-pointer"
                        >
                          <Bell className="h-3 w-3 text-flip-teal transition-colors shrink-0 group-hover:scale-110" />
                          <span className="truncate">Reminders</span>
                        </button>

                        <div className="h-3.5 w-px bg-flip-sky/25" aria-hidden="true" />

                        <button
                          type="button"
                          onClick={() => {
                            setCalendarMode("collection");
                            setIsCalendarOpen(true);
                          }}
                          aria-label="Sync with your calendar"
                          className="group relative flex h-7.5 flex-1 items-center justify-center gap-1.5 rounded-full border border-transparent px-2 text-[11px] font-bold text-flip-tealDark transition-all duration-150 hover:bg-white hover:text-flip-dark hover:shadow-xs active:scale-95 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-flip-teal cursor-pointer"
                        >
                          <Calendar className="h-3 w-3 text-flip-goldDark transition-colors shrink-0 group-hover:scale-110" />
                          <span className="truncate">Calendar</span>
                        </button>
                      </div>
                    }
                  />
                </div>
              )}

              {/* Street Sweeping Schedule */}
              {scheduleView && (
                <div className="flex flex-col empty:hidden">
                  <StreetSweepingCard
                    address={selectedProfile.address}
                    onOpenReminders={(data) => {
                      setSweepingData(data);
                      setReminderMode("street_sweeping");
                      setIsSubscribeOpen(true);
                    }}
                    onOpenCalendar={(data) => {
                      setSweepingData(data);
                      setCalendarMode("street_sweeping");
                      setIsCalendarOpen(true);
                    }}
                  />
                </div>
              )}
            </div>

            {/* Right Column: Bin Sorter & Hazardous Waste */}
            <div className="flex flex-col gap-4 sm:gap-5">
              <WasteAdvisor
                onSelectSpecialCategory={(category) => {
                  setSpecialCategory(category);
                  setActiveTab("special_events");
                }}
              />

              {/* Hazardous Waste Teaser */}
              {nextSpecialEvent && (
                <div className="flex flex-col">
                  <UpcomingEventTeaser
                    event={nextSpecialEvent}
                    now={activeNow}
                    onExplore={() => {
                      setSpecialCategory("batteries_bulbs_oil");
                      setActiveTab("special_events");
                    }}
                  />
                </div>
              )}
            </div>
          </div>

          {selectedProfile && (
            <>
              <SubscribeModal
                isOpen={isSubscribeOpen}
                onClose={() => setIsSubscribeOpen(false)}
                address={selectedProfile.address}
                trashDay={parseDayNameToIndex(selectedProfile.pickupDay)}
                recyclingCadence={
                  isRecyclingWeek(
                    new Date(2026, 0, 5, 12, 0, 0),
                    selectedProfile.recyclingAnchor
                  )
                    ? "alternate_a"
                    : "alternate_b"
                }
                mode={reminderMode}
                sweepingData={sweepingData}
              />

              <CalendarModal
                isOpen={isCalendarOpen}
                onClose={() => setIsCalendarOpen(false)}
                address={selectedProfile.address}
                mode={calendarMode}
                sweepingData={sweepingData}
              />
            </>
          )}
        </div>
      ) : (
        <div
          role="tabpanel"
          id="panel-special-events"
          aria-labelledby="tab-special-events"
          className="space-y-4"
        >
          <SpecialEventsCalendar
            initialData={initialSpecialEvents}
            activeCategory={specialCategory}
            onCategoryChange={setSpecialCategory}
          />
        </div>
      )}

      <AppFooter />
    </div>
  );
}
