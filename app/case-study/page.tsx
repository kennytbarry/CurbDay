import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  Trash2,
  Leaf,
  Recycle,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Cpu,
  Database,
  Bell,
  Car,
  Layers,
  Activity,
  MapPin,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Product Management Case Study | CurbDay San Diego",
  description:
    "Product Management and Technical Architecture case study for CurbDay SD using an Opportunity Solution Tree framework.",
  alternates: {
    canonical: "https://curbday-sd.vercel.app/case-study",
  },
};

interface OSTCardData {
  id: string;
  number: string;
  title: string;
  userQuote: string;
  residentPain: string;
  municipalOpportunity: string;
  shippedSolution: string;
  metricsLabel: string;
  metricsValue: string;
  icon: typeof Trash2;
  accentColor: string;
}

const OST_CARDS: OSTCardData[] = [
  {
    id: "opp-1",
    number: "01",
    title: "Bi-Weekly Recycling Schedule Confusion",
    userQuote: "I never know whether the blue recycling bin goes out tonight.",
    residentPain:
      "Recycling runs on an alternating bi-weekly schedule. Residents constantly forget whether this week is Cycle A or B, leading to missed pickups or guessing by looking at neighbors' curbs.",
    municipalOpportunity:
      "Reduces half-empty blue bin set-outs on off-weeks (saving collection truck fuel and route hours) and decreases missed-collection 311 inquiry volume.",
    shippedSolution:
      "Tactile 'Curb Verdict' Hero Card with 3D cart badges, explicit OUT THIS WEEK vs. STAYS IN states, and 1-click .ics calendar feed subscription.",
    metricsLabel: "Cognitive Load",
    metricsValue: "Instant Glance",
    icon: Recycle,
    accentColor: "border-blue-500/40 text-blue-600 bg-blue-50/60",
  },
  {
    id: "opp-2",
    number: "02",
    title: "Holiday Collection Schedule Shifts",
    userQuote: "Did Memorial Day push my trash pickup back to Saturday?",
    residentPain:
      "City ESD observes 5 official holidays. Pickups on or after a holiday weekday shift by +1 day. Residents routinely forget, rolling bins out 24 hours too early.",
    municipalOpportunity:
      "Prevents heavy bins from blocking scarce residential street parking and protected bike lanes for 48 extra hours, and cuts wind-blown litter.",
    shippedSolution:
      "Deterministic Holiday Slide Engine (lib/holidays.ts) with weekday observance logic, Amber Delay alerts, dynamic .ics recalculation, and proactive evening emails.",
    metricsLabel: "Shift Accuracy",
    metricsValue: "100% Deterministic",
    icon: Calendar,
    accentColor: "border-flip-goldDark/40 text-flip-dark bg-flip-goldLight/30",
  },
  {
    id: "opp-3",
    number: "03",
    title: "Street Sweeping & Parking Citations",
    userQuote: "When do I move my car so I don't get a $62.50 ticket?",
    residentPain:
      "Street sweeping carries a $62.50 citation. The official City lookup is an ArcGIS Experience Builder map that is clunky on mobile devices and completely separate from trash pickup info.",
    municipalOpportunity:
      "Unblocked curbs allow sweepers to clean gutters properly, preventing toxic brake dust, heavy metals, and debris from washing into Mission Bay and storm drains during rainstorms.",
    shippedSolution:
      "Single address lookup unifying trash and sweeping, powered by GeoSweep Layer 13 queries, block ranges, side rules, and 6:00 PM move-car reminders.",
    metricsLabel: "Avoided Fine",
    metricsValue: "$62.50 / Ticket",
    icon: Car,
    accentColor: "border-flip-coral/40 text-flip-coralDark bg-flip-coralLight/20",
  },
  {
    id: "opp-4",
    number: "04",
    title: "Complex SB 1383 Organics Sorting",
    userQuote: "Does this greasy pizza box go in the green bin or trash?",
    residentPain:
      "California SB 1383 requires organic diversion, but rules are counterintuitive (greasy boxes in Green Cart, clean foil in Blue, soiled foil in Trash, PLA cups in Trash).",
    municipalOpportunity:
      "Stops wish-cycling contamination at the MRF, prevents machinery tanglers (plastic bags/hoses), and keeps non-compostable bioplastics out of Miramar Greenery compost windrows.",
    shippedSolution:
      "AI Waste Advisor powered by Google Gemini 1.5 Flash grounded in City ESD regulations, delivering 1-second bin verdicts, prep steps, and conditional pivots.",
    metricsLabel: "Verdict Latency",
    metricsValue: "<1.0s AI Response",
    icon: Leaf,
    accentColor: "border-emerald-500/40 text-emerald-700 bg-emerald-50/60",
  },
  {
    id: "opp-5",
    number: "05",
    title: "Hazardous & Bulky Waste Navigation",
    userQuote: "Where do I legally drop off old paint, batteries, or mattresses?",
    residentPain:
      "Curbside bulky pickup was paused in June 2026. Household Hazardous Waste (HHW) pop-ups occur irregularly across the city and accept only 5 specific item classes.",
    municipalOpportunity:
      "Keeps lithium-ion batteries and chemicals out of collection trucks and landfills, preventing truck fires, worker injuries, and toxic leachate.",
    shippedSolution:
      "Self-updating HHW & Special Events Hub with category filter pills, countdown badges, permanent vs. pop-up routing, and 1-click calendar sync.",
    metricsLabel: "Pop-Up Routing",
    metricsValue: "Instant Schedule",
    icon: AlertTriangle,
    accentColor: "border-purple-500/40 text-purple-700 bg-purple-50/60",
  },
];

const COMPARISON_ROWS = [
  {
    feature: "Mobile-First UX",
    legacyPortal: "Clunky desktop iframe",
    experienceMap: "Heavy desktop GIS map",
    curbday: "Tactile, responsive app (<600ms TTFB)",
    curbdayWins: true,
  },
  {
    feature: "Glanceable Status",
    legacyPortal: "Raw date strings",
    experienceMap: "Cryptic vector layers",
    curbday: "Flighty-style 'Curb Verdict' hero card",
    curbdayWins: true,
  },
  {
    feature: "Holiday Slide Rules",
    legacyPortal: "Static PDF download link",
    experienceMap: "Not available",
    curbday: "Automated engine + Amber Alert banner",
    curbdayWins: true,
  },
  {
    feature: "Street Sweeping Integration",
    legacyPortal: "Completely siloed",
    experienceMap: "Available but hard to navigate",
    curbday: "Unified single address lookup",
    curbdayWins: true,
  },
  {
    feature: "Notification Channels",
    legacyPortal: "None",
    experienceMap: "None",
    curbday: "Evening email alerts (6:00 PM)",
    curbdayWins: true,
  },
  {
    feature: "Calendar Synchronization",
    legacyPortal: "None",
    experienceMap: "None",
    curbday: "1-Click dynamic .ics feed subscription",
    curbdayWins: true,
  },
  {
    feature: "SB 1383 Organics Sorting",
    legacyPortal: "40-page PDF guide",
    experienceMap: "Not available",
    curbday: "Gemini Flash AI advisor with prep steps",
    curbdayWins: true,
  },
  {
    feature: "Hazardous Waste (HHW) Hub",
    legacyPortal: "Unstructured HTML page",
    experienceMap: "Not available",
    curbday: "Interactive pop-up explorer with category filters",
    curbdayWins: true,
  },
  {
    feature: "Operating Cost",
    legacyPortal: "Enterprise contract",
    experienceMap: "Enterprise GIS license",
    curbday: "$0.00/mo (Free-tier serverless edge)",
    curbdayWins: true,
  },
];

export default function CaseStudyPage() {
  return (
    <div className="space-y-8 sm:space-y-12 pb-16">
      {/* Top Navigation Bar */}
      <nav
        aria-label="Case study navigation"
        className="flex items-center justify-between gap-3 border-b-2 border-dashed border-flip-teal/20 pb-4"
      >
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-full border border-flip-teal/30 bg-white px-3.5 py-1.5 text-xs font-bold text-flip-tealDark shadow-xs hover:bg-flip-tealBG hover:text-flip-dark transition-all active:scale-95"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to CurbDay Lookup</span>
        </Link>

        <a
          href="https://github.com/kennytbarry/CurbDay#readme"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full border border-flip-sky/30 bg-flip-cream px-3.5 py-1.5 text-xs font-black text-flip-dark shadow-xs hover:brightness-105 transition-all active:scale-95"
        >
          <span>View Source on GitHub</span>
          <ExternalLink className="h-3.5 w-3.5 opacity-70" />
        </a>
      </nav>

      {/* Hero Header */}
      <header className="space-y-5">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 rounded-full bg-flip-tealBG border border-flip-teal/30 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-flip-tealDark">
            <Layers className="h-3.5 w-3.5" />
            <span>Product Management Case Study</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-flip-dark leading-tight">
            CurbDay SD 🚛🏄: Modernizing Municipal Sanitation for 1.4M San Diegans
          </h1>

          <p className="text-sm sm:text-base text-flip-slate font-medium max-w-3xl leading-relaxed">
            How an <strong>Opportunity Solution Tree</strong> turned fragmented municipal portals into a zero-cost civic utility that eliminates $62.50 street sweeping tickets, clarifies recycling weeks, and protects ocean stormwater.
          </p>
        </div>

        {/* Civic Disclaimer Alert Box (Top) */}
        <div className="rounded-2xl border-2 border-amber-300 bg-amber-50/80 p-4 sm:p-5 text-xs sm:text-sm text-amber-950 font-medium space-y-1 shadow-xs">
          <div className="flex items-center gap-2 font-black text-amber-900 uppercase tracking-wide text-xs">
            <ShieldCheck className="h-4 w-4 text-amber-700 shrink-0" />
            <span>Civic Project Notice</span>
          </div>
          <p className="leading-relaxed">
            Independent civic project; not an official City of San Diego Environmental Services Department (ESD) application. Built in good faith using publicly accessible municipal data with respectful edge caching to help San Diego residents comply with local sanitation, recycling, and hazardous waste regulations.
          </p>
        </div>

        {/* Quick Executive Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 pt-2">
          <div className="rounded-2xl border-2 border-flip-sky/30 bg-white p-4 text-center shadow-xs">
            <div className="text-xl sm:text-2xl font-black text-flip-tealDark">$0.00 / mo</div>
            <div className="text-xs text-flip-slate font-bold">Operating Budget</div>
          </div>
          <div className="rounded-2xl border-2 border-flip-sky/30 bg-white p-4 text-center shadow-xs">
            <div className="text-xl sm:text-2xl font-black text-flip-dark">1.4M+</div>
            <div className="text-xs text-flip-slate font-bold">Residents Served</div>
          </div>
          <div className="rounded-2xl border-2 border-flip-sky/30 bg-white p-4 text-center shadow-xs">
            <div className="text-xl sm:text-2xl font-black text-flip-coral">&lt;600 ms</div>
            <div className="text-xs text-flip-slate font-bold">Edge TTFB Speed</div>
          </div>
          <div className="rounded-2xl border-2 border-flip-sky/30 bg-white p-4 text-center shadow-xs">
            <div className="text-xl sm:text-2xl font-black text-flip-goldDark">5 Rules</div>
            <div className="text-xs text-flip-slate font-bold">Continuous OST Pillars</div>
          </div>
        </div>
      </header>

      {/* Section 1: The Broken Baseline & Benchmarks */}
      <section aria-labelledby="heading-benchmarks" className="space-y-4">
        <div className="space-y-1">
          <h2 id="heading-benchmarks" className="text-xl sm:text-2xl font-black tracking-tight text-flip-dark">
            1. The Problem: Fragmented Municipal Portals
          </h2>
          <p className="text-xs sm:text-sm text-flip-slate font-medium">
            Residents interact with the curb every week, yet municipal services are isolated across disconnected portals:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Benchmark 1 */}
          <div className="rounded-2xl border-2 border-flip-sky/25 bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-flip-slate">
                Benchmark 01
              </span>
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                Desktop-Era Lookup
              </span>
            </div>
            <h3 className="text-base font-extrabold text-flip-dark">
              Get It Done: CollectionMapLookup
            </h3>
            <p className="text-xs text-flip-slate leading-relaxed font-medium">
              The City’s legacy trash tool displays raw unformatted database timestamps (e.g., <code>Trash: Fri 10/23, Recycle: Fri 10/30</code>) inside a clunky desktop map iframe. It provides zero proactive alerts, no calendar integration, and zero advance warnings when holidays delay collection.
            </p>
            <div className="text-xs font-bold text-flip-tealDark">
              Impact: Missed pickups &amp; off-week recycling clutter.
            </div>
          </div>

          {/* Benchmark 2 */}
          <div className="rounded-2xl border-2 border-flip-sky/25 bg-white p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-black uppercase tracking-wider text-flip-slate">
                Benchmark 02
              </span>
              <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                $62.50 Parking Risk
              </span>
            </div>
            <h3 className="text-base font-extrabold text-flip-dark">
              ArcGIS Experience Builder Sweeping Map
            </h3>
            <p className="text-xs text-flip-slate leading-relaxed font-medium">
              The official street sweeping tool forces residents to manually hunt and pinch-zoom across complex vector layers on mobile, deciphering cryptic text strings (<code>NS ES Both Sides Even Month 3rd Wed</code>). Because it is siloed from waste schedules, residents forget to move cars.
            </p>
            <div className="text-xs font-bold text-flip-coralDark">
              Impact: Costly parking citations &amp; un-swept gutter debris.
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Teresa Torres Opportunity Solution Tree (OST) */}
      <section aria-labelledby="heading-ost" className="space-y-5">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-flip-teal">
            <Activity className="h-4 w-4" />
            <span>Discovery Framework</span>
          </div>
          <h2 id="heading-ost" className="text-xl sm:text-2xl font-black tracking-tight text-flip-dark">
            2. Opportunity Solution Tree: Dual-Sided Civic Value
          </h2>
          <p className="text-xs sm:text-sm text-flip-slate font-medium max-w-3xl leading-relaxed">
            Every resident friction point directly mirrors an expensive municipal operational cost for the City of San Diego. Solving for the resident creates measurable civic value:
          </p>
        </div>

        {/* 5 Visual OST Pillar Cards */}
        <div className="space-y-4">
          {OST_CARDS.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.id}
                className="rounded-3xl border-2 border-flip-sky/30 bg-white p-5 sm:p-6 shadow-xs space-y-4"
              >
                {/* Header */}
                <div className="flex flex-wrap items-center justify-between gap-2 border-b-2 border-dashed border-flip-sky/25 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border-2 border-flip-teal/30 bg-flip-tealBG text-flip-teal font-black text-sm">
                      {card.number}
                    </span>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-flip-dark">
                        {card.title}
                      </h3>
                      <div className="text-xs font-bold text-flip-slate italic">
                        &ldquo;{card.userQuote}&rdquo;
                      </div>
                    </div>
                  </div>

                  <span className="rounded-full bg-flip-tealBG border border-flip-teal/30 px-3 py-1 text-xs font-black text-flip-tealDark">
                    {card.metricsLabel}: {card.metricsValue}
                  </span>
                </div>

                {/* 3-Column Breakdown: Resident Pain -> Municipal Value -> Shipped Solution */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1 text-xs sm:text-[13px]">
                  {/* Col 1 */}
                  <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-3.5 space-y-1.5">
                    <div className="font-black text-rose-800 uppercase tracking-wider text-[10px]">
                      Resident Pain Point
                    </div>
                    <p className="text-flip-dark leading-relaxed font-medium">
                      {card.residentPain}
                    </p>
                  </div>

                  {/* Col 2 */}
                  <div className="rounded-2xl border border-flip-teal/30 bg-flip-tealBG/60 p-3.5 space-y-1.5">
                    <div className="font-black text-flip-tealDark uppercase tracking-wider text-[10px]">
                      Parallel Municipal Opportunity
                    </div>
                    <p className="text-flip-dark leading-relaxed font-medium">
                      {card.municipalOpportunity}
                    </p>
                  </div>

                  {/* Col 3 */}
                  <div className="rounded-2xl border border-flip-sky/40 bg-white p-3.5 space-y-1.5 shadow-xs">
                    <div className="font-black text-flip-dark uppercase tracking-wider text-[10px] flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                      <span>CurbDay Shipped Solution</span>
                    </div>
                    <p className="text-flip-dark leading-relaxed font-medium">
                      {card.shippedSolution}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3: Product Benchmarks & Feature Comparison Matrix */}
      <section aria-labelledby="heading-matrix" className="space-y-4">
        <div className="space-y-1">
          <h2 id="heading-matrix" className="text-xl sm:text-2xl font-black tracking-tight text-flip-dark">
            3. Feature Comparison Matrix
          </h2>
          <p className="text-xs sm:text-sm text-flip-slate font-medium">
            Comparing legacy municipal portals against the unified CurbDay SD platform:
          </p>
        </div>

        <div className="overflow-x-auto rounded-3xl border-2 border-flip-sky/30 bg-white shadow-xs">
          <table className="w-full text-left text-xs sm:text-sm border-collapse">
            <thead>
              <tr className="border-b-2 border-flip-sky/25 bg-slate-50/80 font-black text-flip-dark text-[11px] uppercase tracking-wider">
                <th className="p-3 sm:p-4">Capability</th>
                <th className="p-3 sm:p-4 text-slate-500">CollectionMapLookup</th>
                <th className="p-3 sm:p-4 text-slate-500">ArcGIS Experience</th>
                <th className="p-3 sm:p-4 text-flip-tealDark bg-flip-tealBG/50">CurbDay SD</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-flip-sky/20 font-medium">
              {COMPARISON_ROWS.map((row, idx) => (
                <tr key={idx} className="hover:bg-flip-cream/30 transition-colors">
                  <td className="p-3 sm:p-4 font-bold text-flip-dark">
                    {row.feature}
                  </td>
                  <td className="p-3 sm:p-4 text-slate-500">
                    <span className="flex items-center gap-1.5">
                      <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                      <span>{row.legacyPortal}</span>
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 text-slate-500">
                    <span className="flex items-center gap-1.5">
                      {row.experienceMap.startsWith("Available") ? (
                        <CheckCircle2 className="h-4 w-4 text-amber-500 shrink-0" />
                      ) : (
                        <XCircle className="h-4 w-4 text-rose-500 shrink-0" />
                      )}
                      <span>{row.experienceMap}</span>
                    </span>
                  </td>
                  <td className="p-3 sm:p-4 font-bold text-flip-dark bg-flip-tealBG/30">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                      <span>{row.curbday}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Section 4: Zero-Cost Technical Architecture */}
      <section aria-labelledby="heading-arch" className="space-y-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wide text-flip-teal">
            <Cpu className="h-4 w-4" />
            <span>Civic Engineering</span>
          </div>
          <h2 id="heading-arch" className="text-xl sm:text-2xl font-black tracking-tight text-flip-dark">
            4. Zero-Cost Architecture &amp; Respectful Civic Caching
          </h2>
          <p className="text-xs sm:text-sm text-flip-slate font-medium max-w-3xl leading-relaxed">
            Engineered on a <strong>$0.00/month free-tier budget</strong> that respects municipal infrastructure through aggressive caching and intelligent rate limiting:
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-2xl border-2 border-flip-sky/30 bg-white p-4 space-y-2 shadow-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-flip-tealBG text-flip-teal border border-flip-teal/20">
              <Layers className="h-4 w-4" />
            </div>
            <h3 className="font-extrabold text-sm text-flip-dark">Vercel Edge &amp; Next.js</h3>
            <p className="text-xs text-flip-slate leading-relaxed font-medium">
              Next.js 16 App Router on Vercel Hobby Tier. Sub-600ms edge TTFB with server-rendered address resolution.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-flip-sky/30 bg-white p-4 space-y-2 shadow-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-flip-tealBG text-flip-teal border border-flip-teal/20">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <h3 className="font-extrabold text-sm text-flip-dark">Respectful 7-Day ISR</h3>
            <p className="text-xs text-flip-slate leading-relaxed font-medium">
              City event endpoints query at most once a week (<code>revalidate: 604800</code>), protecting municipal servers.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-flip-sky/30 bg-white p-4 space-y-2 shadow-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-flip-tealBG text-flip-teal border border-flip-teal/20">
              <Sparkles className="h-4 w-4" />
            </div>
            <h3 className="font-extrabold text-sm text-flip-dark">Grounded Gemini AI</h3>
            <p className="text-xs text-flip-slate leading-relaxed font-medium">
              Gemini 1.5 Flash Free Tier with in-memory LRU cache and per-IP sliding rate-limiters preventing abuse.
            </p>
          </div>

          <div className="rounded-2xl border-2 border-flip-sky/30 bg-white p-4 space-y-2 shadow-xs">
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-flip-tealBG text-flip-teal border border-flip-teal/20">
              <Database className="h-4 w-4" />
            </div>
            <h3 className="font-extrabold text-sm text-flip-dark">Supabase &amp; Vercel Cron</h3>
            <p className="text-xs text-flip-slate leading-relaxed font-medium">
              PostgreSQL on Supabase Free Tier paired with daily Vercel Crons executing evening reminder dispatches.
            </p>
          </div>
        </div>
      </section>

      {/* Footer & Civic Notice */}
      <footer className="space-y-4 pt-6 border-t-2 border-dashed border-flip-teal/20">
        <div className="rounded-2xl border border-amber-300/80 bg-amber-50/60 p-4 text-xs text-amber-950 font-medium space-y-1">
          <div className="font-black text-amber-900 uppercase tracking-wide text-[11px]">
            Civic Disclaimer
          </div>
          <p>
            Independent civic project; not an official City of San Diego Environmental Services Department (ESD) application. Built in good faith using publicly accessible municipal data with respectful edge caching to help San Diego residents comply with local sanitation, recycling, and hazardous waste regulations.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-flip-slate font-medium">
          <div>
            Built with ❤️ in San Diego by <strong>Kenny Barry</strong> · Released under the{" "}
            <a href="https://github.com/kennytbarry/CurbDay/blob/main/LICENSE" className="text-flip-tealDark font-bold underline">
              MIT License
            </a>
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 font-bold text-flip-tealDark hover:underline"
          >
            <span>Return to CurbDay Schedule Tracker</span>
            <ArrowLeft className="h-3.5 w-3.5 rotate-180" />
          </Link>
        </div>
      </footer>
    </div>
  );
}
