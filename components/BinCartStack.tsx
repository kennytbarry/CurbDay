import {
  Leaf,
  Recycle,
  Trash2,
  type LucideIcon,
} from "lucide-react";

interface BinCartStackProps {
  trashDate?: string;
  organicsDate?: string;
  recyclingDate?: string;
  recyclingActive: boolean;
  /** Short date of the next recycling pickup, shown when recycling stays in. */
  nextRecyclingDate?: string;
}

interface CartRowProps {
  icon: LucideIcon;
  title: string;
  date?: string;
  iconClass: string;
  className?: string;
  isInactive?: boolean;
}

function CartRow({
  icon: Icon,
  title,
  date,
  iconClass,
  className = "",
  isInactive = false,
}: CartRowProps) {
  return (
    <li
      className={`flex items-center justify-between gap-3 py-1.5 px-1 ${
        isInactive ? "opacity-60" : ""
      } ${className}`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`flex h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-xl shadow-xs ${iconClass}`}
        >
          <Icon className="h-4 w-4" aria-hidden="true" />
        </span>

        <span
          className={`text-xs sm:text-sm font-black leading-tight tracking-tight ${
            isInactive ? "text-slate-500" : "text-flip-dark"
          }`}
        >
          {title}
        </span>
      </div>

      {date && (
        <span
          className={`shrink-0 text-xs font-black tracking-tight py-0.5 px-3 rounded-full border shadow-xs ${
            isInactive
              ? "text-slate-600 bg-slate-100 border-slate-200"
              : "text-flip-tealDark bg-flip-tealBG border-flip-teal/30"
          }`}
        >
          {date}
        </span>
      )}
    </li>
  );
}

export default function BinCartStack({
  trashDate,
  organicsDate,
  recyclingDate,
  recyclingActive,
  nextRecyclingDate,
}: BinCartStackProps) {
  const effectiveRecyclingDate = recyclingDate ?? nextRecyclingDate;

  return (
    <ul
      aria-label="Carts"
      className="space-y-1.5 sm:space-y-2 py-0.5"
    >
      <CartRow
        icon={Trash2}
        title="Trash"
        date={trashDate}
        iconClass="bg-zinc-800 text-zinc-100 border border-zinc-900"
      />
      <CartRow
        icon={Leaf}
        title="Organics"
        date={organicsDate}
        iconClass="bg-emerald-600 text-white border border-emerald-700"
      />
      {recyclingActive ? (
        <CartRow
          icon={Recycle}
          title="Recycling"
          date={effectiveRecyclingDate}
          iconClass="bg-blue-600 text-white border border-blue-700"
        />
      ) : (
        <li
          aria-label={
            effectiveRecyclingDate
              ? `Recycling stays in this week. Next pickup: ${effectiveRecyclingDate}`
              : "Recycling stays in, Skipped this week"
          }
          className="bin-badge-recycling-inactive flex items-center justify-between gap-3 py-1.5 px-1 opacity-60"
        >
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex h-8 w-8 sm:h-8.5 sm:w-8.5 shrink-0 items-center justify-center rounded-xl border border-dashed border-slate-300 bg-slate-100 text-slate-400 shadow-xs">
              <Recycle className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="text-xs sm:text-sm font-bold leading-tight tracking-tight text-slate-500">
              Recycling
            </span>
          </div>
          {effectiveRecyclingDate && (
            <span className="shrink-0 text-xs font-bold tracking-tight text-slate-600 bg-slate-100 py-0.5 px-3 rounded-full border border-slate-200 shadow-xs">
              {effectiveRecyclingDate}
            </span>
          )}
        </li>
      )}
    </ul>
  );
}
