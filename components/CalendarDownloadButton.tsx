"use client";

import { Calendar } from "lucide-react";
import { trackCalendarExported } from "@/lib/analytics";
import type { ReactNode } from "react";

interface CalendarDownloadButtonProps {
  /** Static/serverless .ics endpoint (e.g. /api/calendar/[slug]). */
  href?: string;
  /** Client-side generator, used when no endpoint is available. */
  buildIcs?: () => string;
  fileName?: string;
  className?: string;
  label?: ReactNode;
}

const DEFAULT_BUTTON_CLASS =
  "group relative flex h-10 w-full cursor-pointer items-center justify-center gap-1.5 rounded-xl border border-white/15 bg-white/5 hover:border-cc-gold/60 hover:bg-white/10 px-2 sm:px-2.5 text-xs font-bold text-cc-bone hover:text-white shadow-xs transition-all duration-150 active:scale-[0.98] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-cc-gold";

export default function CalendarDownloadButton({
  href,
  buildIcs,
  fileName = "curbday-schedule.ics",
  className,
  label,
}: CalendarDownloadButtonProps) {
  function handleDownload() {
    if (!buildIcs) return;
    trackCalendarExported("ics", fileName);
    const blob = new Blob([buildIcs()], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const content = label ?? (
    <>
      <Calendar className="h-3.5 w-3.5 shrink-0 text-flip-goldDark group-hover:text-white transition-colors" />
      <span className="truncate">Add to Calendar</span>
    </>
  );

  const buttonClass = className ?? DEFAULT_BUTTON_CLASS;

  return href ? (
    <a href={href} download className={buttonClass}>
      {content}
    </a>
  ) : (
    <button type="button" onClick={handleDownload} className={buttonClass}>
      {content}
    </button>
  );
}
