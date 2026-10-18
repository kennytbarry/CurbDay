import BinCartStack from "@/components/BinCartStack";
import type { ReactNode } from "react";

interface BinStatusHeroProps {
  address?: string;
  /** Deprecated */
  putOutPhrase?: string;
  /** "Friday, Oct 23" */
  pickupDate?: string;
  pickupMorning?: string;
  trashDate?: string;
  organicsDate?: string;
  recyclingDate?: string;
  recyclingActive: boolean;
  nextRecyclingDate?: string;
  /** Present when a holiday moved this pickup (e.g. "Thanksgiving"). */
  holidayName?: string;
  /** Rendered in the action row of the card. */
  footer?: ReactNode;
}

export default function BinStatusHero({
  pickupDate,
  pickupMorning,
  trashDate,
  organicsDate,
  recyclingDate,
  recyclingActive,
  nextRecyclingDate,
  holidayName,
  footer,
}: BinStatusHeroProps) {
  const displayDate = pickupDate || pickupMorning || "Next Collection Dates";

  return (
    <section
      aria-label="Next pickup"
      className="relative flex flex-col space-y-4 rounded-3xl border-2 border-flip-sky/30 bg-white p-5 sm:p-6 shadow-xs"
    >
      <div className="flex items-start justify-between gap-3 border-b-2 border-dashed border-flip-sky/25 pb-3">
        <div className="space-y-0.5 min-w-0">
          <h2 className="text-base sm:text-lg font-black tracking-tight text-flip-dark">
            Curbside Collection
          </h2>
          <div className="text-xs text-flip-slate font-bold truncate">
            {recyclingActive
              ? "Recycling goes out this week"
              : "Recycling stays in this week"}
          </div>
        </div>

        {holidayName && (
          <div className="flex items-center shrink-0 pt-0.5">
            <span
              title={`${holidayName} delay`}
              className="inline-flex items-center gap-1 rounded-full border border-flip-goldDark/40 bg-flip-gold px-3.5 py-1 text-xs font-black text-flip-dark shadow-flip-gold-glow"
            >
              +1 day · {holidayName}
            </span>
          </div>
        )}
      </div>

      <BinCartStack
        trashDate={trashDate}
        organicsDate={organicsDate}
        recyclingDate={recyclingDate}
        recyclingActive={recyclingActive}
        nextRecyclingDate={nextRecyclingDate}
      />

      {footer && <div className="pt-1">{footer}</div>}
    </section>
  );
}
