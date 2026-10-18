import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://curbday-sd.vercel.app"),
  title: {
    default: "CurbDay | San Diego Trash, Recycling & Organics Schedule Tracker",
    template: "%s | CurbDay San Diego",
  },
  description:
    "Instant City of San Diego curbside pickup schedules (Trash, Blue Cart Recycling, Green Cart Organics), holiday delay alerts, calendar sync, and hazardous waste drop-off tracker.",
  keywords: [
    "CurbDay",
    "CurbDay San Diego",
    "San Diego trash schedule",
    "San Diego recycling schedule",
    "San Diego holiday trash delay",
    "San Diego green bin SB 1383",
    "Miramar greenery composting",
    "San Diego blue bin rules",
    "San Diego hazardous waste drop off",
    "Miramar recycling center mattress drop off",
    "San Diego curbside collection calendar",
  ],
  alternates: {
    canonical: "https://curbday-sd.vercel.app",
  },
  openGraph: {
    title: "CurbDay | San Diego Trash, Recycling & Organics Schedule",
    description:
      "Instant San Diego curbside collection schedules with automated holiday slide alerts, recycling calendars, and hazardous waste drop-off guide.",
    url: "https://curbday-sd.vercel.app",
    siteName: "CurbDay San Diego",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CurbDay | San Diego Curbside Pickup & Waste Tracker",
    description:
      "Instant San Diego curbside pickup schedules, holiday delay alerts, and hazardous waste drop-off guide.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#2BA8A2",
};

const JSON_LD_DATA = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebApplication",
      "@id": "https://curbday-sd.vercel.app/#app",
      name: "CurbDay",
      alternateName: "CurbDay San Diego",
      url: "https://curbday-sd.vercel.app",
      description:
        "Instant City of San Diego curbside trash, recycling, and organic waste schedules with holiday delay alerts, calendar sync, and hazardous waste drop-off directory.",
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "All",
      browserRequirements: "Requires modern web browser",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      areaServed: {
        "@type": "City",
        name: "San Diego",
        sameAs: "https://en.wikipedia.org/wiki/San_Diego",
      },
    },
    {
      "@type": "GovernmentService",
      "@id": "https://curbday-sd.vercel.app/#hhw-transfer-facility",
      name: "Miramar Household Hazardous Waste (HHW) Transfer Facility",
      serviceType: "Household Hazardous Waste Disposal",
      provider: {
        "@type": "GovernmentOrganization",
        name: "City of San Diego Environmental Services Department",
        url: "https://www.sandiego.gov/environmental-services",
      },
      areaServed: {
        "@type": "City",
        name: "San Diego",
      },
      serviceLocation: {
        "@type": "Place",
        name: "Miramar HHW Transfer Facility",
        address: {
          "@type": "PostalAddress",
          streetAddress: "5161 Convoy St",
          addressLocality: "San Diego",
          addressRegion: "CA",
          postalCode: "92111",
          addressCountry: "US",
        },
        telephone: "+1-858-694-7000",
      },
      hoursAvailable: {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Wednesday", "Saturday"],
        opens: "09:00",
        closes: "15:00",
      },
    },
    {
      "@type": "RecyclingCenter",
      "@id": "https://curbday-sd.vercel.app/#miramar-recycling-center",
      name: "Miramar Recycling Center & Greenery",
      address: {
        "@type": "PostalAddress",
        streetAddress: "5165 Convoy St",
        addressLocality: "San Diego",
        addressRegion: "CA",
        postalCode: "92111",
        addressCountry: "US",
      },
      openingHours: "Mo-Sa 07:00-16:00",
      description:
        "Miramar Recycling Center accepts TVs, e-waste, appliances, scrap metal, and provides free mattress drop-off (Mon-Fri 7 AM - 3 PM) under the California Bye Bye Mattress program.",
    },
    {
      "@type": "FAQPage",
      "@id": "https://curbday-sd.vercel.app/#faq",
      mainEntity: [
        {
          "@type": "Question",
          name: "When does trash pickup get delayed for holidays in San Diego?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The City of San Diego observes exactly five collection holidays: New Year's Day, Memorial Day, Labor Day, Thanksgiving Day, and Christmas Day. When one of these holidays falls on a weekday (Monday–Friday), curbside pickup for the holiday and all remaining weekdays of that week is delayed by one business day (e.g., Thursday shifts to Friday, Friday shifts to Saturday). Weekend holidays do not cause delays.",
          },
        },
        {
          "@type": "Question",
          name: "Can meat, bones, and dairy go into the green organics bin in San Diego?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Under California Senate Bill 1383, all raw and cooked food scraps—including meat, poultry, fish, bones, dairy, cheese, butter, coffee grounds, and greasy pizza boxes—are accepted in the Green Cart. Organic waste is processed into compost at the City of San Diego Miramar Greenery.",
          },
        },
        {
          "@type": "Question",
          name: "Are compostable plastic cups accepted in San Diego green bins?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. The City of San Diego Miramar Greenery strictly rejects all 'compostable' or 'biodegradable' bioplastic bags, cups, cutlery, and containers (PLA plastics). The processing equipment cannot distinguish them from petroleum plastics, and they do not break down fast enough in municipal compost windrows. Place PLA bioplastics in the Black Cart (Trash).",
          },
        },
        {
          "@type": "Question",
          name: "Should plastic bottle caps be screwed on or taken off in San Diego blue bins?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Plastic bottle and jar caps must be screwed on tightly to empty, clean plastic containers before recycling. Loose caps smaller than 2 inches fall through the sorting line grates at the Allan Company recycling center into the landfill reject stream.",
          },
        },
        {
          "@type": "Question",
          name: "Where can I drop off batteries and electronics in San Diego?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "It is illegal to place batteries or electronics in any curbside cart (Black, Blue, or Green) due to fire hazards. Bring household batteries and bulbs to periodic Saturday Pop-Up events (no appointment), or drop off paint, chemicals, and sharps at the Miramar HHW Transfer Facility at 5161 Convoy St (appointment via 858-694-7000).",
          },
        },
        {
          "@type": "Question",
          name: "Is recycling collected every week in San Diego?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "No. Blue Cart recycling in the City of San Diego is collected bi-weekly (every other week) on the same day as weekly trash and organics pickup.",
          },
        },
      ],
    },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <head>
        <link
          rel="alternate"
          type="text/markdown"
          href="/llms.txt"
          title="LLM and AI Agent Context"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(JSON_LD_DATA) }}
        />
      </head>
      <body className="relative min-h-screen bg-gradient-to-b from-[#E2F4F2] via-[#EFF8F7] to-[#F4FAF9] text-flip-dark font-sans antialiased selection:bg-flip-gold selection:text-flip-dark">
        {/* Skip to Main Content Link for Keyboard and Screen-Reader Users (WCAG 2.4.1) */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:rounded-full focus:bg-flip-gold focus:px-4 focus:py-2 focus:text-xs focus:font-extrabold focus:text-flip-dark focus:shadow-flip-gold-glow focus:ring-2 focus:ring-flip-teal"
        >
          Skip to main content
        </a>

        {/* Flip7 Retro Top Trim: Solid Teal Accent */}
        <div aria-hidden="true" className="fixed inset-x-0 top-0 z-40">
          <div className="h-1 bg-flip-teal" />
        </div>

        {/* Subtle ambient gradients giving the page natural depth and warmth */}
        <div
          aria-hidden="true"
          className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(ellipse_85%_65%_at_50%_-10%,rgba(43,168,162,0.18),transparent_70%),radial-gradient(ellipse_70%_55%_at_100%_25%,rgba(255,210,63,0.12),transparent_60%),radial-gradient(ellipse_70%_60%_at_0%_75%,rgba(43,168,162,0.10),transparent_60%)]"
        />

        <main id="main-content" className="relative mx-auto max-w-[480px] md:max-w-3xl lg:max-w-4xl px-4 py-6 sm:py-8 lg:py-10 transition-all">
          {children}
        </main>
        <Analytics />
      </body>
    </html>
  );
}
