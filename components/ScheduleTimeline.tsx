import { Leaf, Recycle, Trash2 } from "lucide-react";
import type { CollectionEvent } from "@/lib/schedule";
import { formatShortDate } from "@/lib/schedule";

interface ScheduleTimelineProps {
  events: CollectionEvent[];
  embedded?: boolean;
}

export default function ScheduleTimeline({
  events,
  embedded = false,
}: ScheduleTimelineProps) {
  return (
    <section aria-labelledby="timeline-heading" className="space-y-2.5">
      <div className="flex items-center justify-between px-0.5">
        <h2
          id="timeline-heading"
          className="text-[11px] font-black uppercase tracking-wider text-flip-tealDark flex items-center gap-1.5"
        >
          Next 3 Weeks
        </h2>
      </div>

      <ol className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {events.map(({ pickup, recycling }) => (
          <li
            key={pickup.originalDateKey}
            className={`relative flex flex-col justify-between gap-2.5 rounded-2xl border-2 transition-all ${
              embedded
                ? "border border-flip-teal/20 bg-white p-3 sm:p-3.5 shadow-xs hover:border-flip-teal/40"
                : "border border-flip-teal/20 bg-white p-3.5 shadow-xs"
            }`}
          >
            <div className="space-y-0.5">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-flip-tealDark">
                  {pickup.actualDayName.slice(0, 3)}
                </span>
                {pickup.isDelayed && (
                  <span
                    title={pickup.holidayName ?? undefined}
                    className="rounded-md bg-flip-coral/15 px-1.5 py-0.5 text-[10px] font-extrabold text-flip-coralDark ring-1 ring-inset ring-flip-coral/30"
                  >
                    +1d
                  </span>
                )}
              </div>
              <div className="text-base font-black tracking-tight tabular-nums text-flip-dark">
                {formatShortDate(pickup.actualDate)}
              </div>
            </div>

            <div
              className="flex items-center gap-1.5"
              aria-label={
                recycling ? "Trash, organics, recycling" : "Trash, organics"
              }
              role="img"
            >
              <span
                title="Trash"
                className="flex h-6 w-6 items-center justify-center rounded-lg bg-zinc-900 text-white shadow-xs"
              >
                <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span
                title="Organics"
                className="flex h-6 w-6 items-center justify-center rounded-lg bg-emerald-600 text-white shadow-xs"
              >
                <Leaf className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              {recycling ? (
                <span
                  title="Recycling"
                  className="flex h-6 w-6 items-center justify-center rounded-lg bg-blue-600 text-white shadow-xs"
                >
                  <Recycle className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              ) : (
                <span
                  title="Recycling skipped"
                  className="flex h-6 w-6 items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white/70 text-slate-400 opacity-60"
                >
                  <Recycle className="h-3.5 w-3.5" aria-hidden="true" />
                </span>
              )}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
