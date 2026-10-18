import { AlertTriangle } from "lucide-react";

interface HolidayAlertBannerProps {
  message: string;
}

export default function HolidayAlertBanner({ message }: HolidayAlertBannerProps) {
  return (
    <section
      aria-label="Holiday delay notice"
      className="alert-holiday-delay flex items-start gap-3 rounded-2xl px-4 py-3.5"
    >
      <AlertTriangle
        className="mt-0.5 h-5 w-5 shrink-0 text-amber-600"
        aria-hidden="true"
      />
      <div className="space-y-0.5">
        <h2 className="text-sm font-bold text-amber-950">
          Holiday Schedule: +1 Day Delay
        </h2>
        <p className="text-sm leading-snug text-amber-950/90">{message}</p>
      </div>
    </section>
  );
}
