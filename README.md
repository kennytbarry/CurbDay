# CurbDay SD 🚛🏄
### *Modernizing Municipal Sanitation & Street Sweeping for 1.4M San Diegans*

> *"Wheels in, surf’s up"* 🏄

[![Production App](https://img.shields.io/badge/Production-curbday--sd.vercel.app-2BA8A2?style=for-the-badge&logo=vercel&logoColor=white)](https://curbday-sd.vercel.app/)
[![Case Study](https://img.shields.io/badge/Product_Case_Study-Live_Route-FFD23F?style=for-the-badge&logo=read-the-docs&labelColor=142826&color=FFD23F)](https://curbday-sd.vercel.app/case-study)
[![License: MIT](https://img.shields.io/badge/License-MIT-EF6C4A?style=for-the-badge)](LICENSE)
[![Framework](https://img.shields.io/badge/Next.js_16-App_Router-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Database](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![AI Runtime](https://img.shields.io/badge/Google_Gemini-1.5_Flash-4285F4?style=for-the-badge&logo=google)](https://ai.google.dev/)

> [!IMPORTANT]
> **Civic Project Notice:**  
> *Independent civic project; not an official City of San Diego Environmental Services Department (ESD) application. Built in good faith using publicly accessible municipal data with respectful edge caching to help San Diego residents comply with local sanitation, recycling, and hazardous waste regulations.*

---

## The Problem

San Diego municipal curb data is fragmented across disconnected, desktop-era tools:
- **Curbside Collection ([CollectionMapLookup](https://getitdone.sandiego.gov/CollectionMapLookup)):** Returns raw unformatted database timestamps (`"Trash: Fri 10/23, Recycle: Fri 10/30"`) with no glanceable status, no calendar export, and zero warning when city holidays slide collection by +1 day.
- **Street Sweeping ([ArcGIS Experience Map](https://webmaps.sandiego.gov/portal/apps/experiencebuilder/experience/?id=d2f56932d1764a009321162ad6ea2b7e#data_s=id%3A48e8f81aac304310ba1edb3dfbe6c21e-GeoSweep_Dynamic_9608%3A1986)):** A heavy, slow GIS map divorced from household trash schedules—causing residents to miss sweeping days and incur **$62.50 parking citations**.
- **Sorting & Hazardous Waste:** 40-page PDF guidelines for SB 1383 organics sorting and buried one-day drop-off events for toxic household chemicals.

**CurbDay SD** unifies household waste schedules, holiday slide rules, street sweeping enforcement, and an AI-powered waste advisor into a single, mobile-first lookup.

---

## Dual-Sided Civic Value

Every resident friction point directly mirrors an operational challenge for the City of San Diego. Solving for the resident delivers measurable public service value:

```mermaid
graph TD
    classDef outcome fill:#2BA8A2,stroke:#1E8C86,stroke-width:2px,color:#FFFFFF,font-weight:bold;
    classDef opp fill:#FFF8E7,stroke:#FFD23F,stroke-width:2px,color:#142826;
    classDef muni fill:#EFF8F7,stroke:#2BA8A2,stroke-width:2px,color:#142826;
    classDef sol fill:#142826,stroke:#2BA8A2,stroke-width:2px,color:#FFFFFF;

    Outcome["DESIRED CIVIC OUTCOME: Curbside Compliance, Zero Sweeping Tickets & Contamination-Free Waste Streams"]:::outcome

    O1["'Does blue bin go out tonight?'<br>Bi-weekly recycling confusion"]:::opp
    O2["'Is pickup delayed?'<br>Holiday schedule uncertainty"]:::opp
    O3["'When do I move my car?'<br>$62.50 street sweeping citations"]:::opp
    O4["'Which bin does this go in?'<br>Complex SB 1383 sorting rules"]:::opp
    O5["'Where do I take old paint/batteries?'<br>Hazardous & bulky drop-off friction"]:::opp

    Outcome --> O1
    Outcome --> O2
    Outcome --> O3
    Outcome --> O4
    Outcome --> O5

    M1["Route Efficiency<br>Cuts empty bin set-outs & 311 missed-pickup calls"]:::muni
    M2["Street Safety<br>Prevents bins blocking bike lanes & parking for 48 extra hours"]:::muni
    M3["Clean Stormwater<br>Unblocked gutters let sweepers capture brake dust before ocean runoff"]:::muni
    M4["Compost Quality<br>Keeps plastic bags & PLA out of Miramar Greenery compost windrows"]:::muni
    M5["Worker Safety<br>Keeps lithium-ion batteries out of compactor trucks, preventing fires"]:::muni

    O1 --- M1
    O2 --- M2
    O3 --- M3
    O4 --- M4
    O5 --- M5

    S1["'Curb Verdict' Hero Card<br>Tactile 3D Cart Badges + OUT vs. IN state + 1-click .ics sync"]:::sol
    S2["Holiday Slide Engine<br>Deterministic holiday rules + Amber Eve alert banner + synced .ics"]:::sol
    S3["Unified Trash + Sweeping Lookup<br>GeoSweep Layer 13 parser + 6:00 PM evening move-car alerts"]:::sol
    S4["Grounded Gemini Flash Waste Advisor<br>Sub-second bin verdicts, prep steps, and clean vs. soiled pivots"]:::sol
    S5["Self-Updating HHW & Events Hub<br>Category filter pills, permanent vs. pop-up routing, calendar sync"]:::sol

    M1 --> S1
    M2 --> S2
    M3 --> S3
    M4 --> S4
    M5 --> S5
```

| Resident Opportunity | City / Public Service Impact | Shipped CurbDay Solution |
| :--- | :--- | :--- |
| **1. Bi-Weekly Recycling** | Cuts empty bin set-outs and 311 missed-collection calls | **Curb Verdict Hero Card** with 3D cart badges, OUT vs. IN state, and 1-click `.ics` sync |
| **2. Holiday Delays** | Prevents bins blocking bike lanes and parking for 48 extra hours | **Deterministic Holiday Slide Engine** (`lib/holidays.ts`) with high-contrast Amber Eve alerts |
| **3. Street Sweeping Citations** | Unblocks gutters so sweepers capture toxic brake dust before ocean runoff | **Unified Address Lookup** combining collection + GeoSweep Layer 13 with 6:00 PM email alerts |
| **4. SB 1383 Organics Sorting** | Prevents MRF sorting machinery tanglers and keeps PLA bioplastics out of Miramar compost | **Gemini 1.5 Flash Waste Advisor** grounded in City ESD rules with prep steps and conditional pivots |
| **5. Hazardous & Bulky Waste** | Keeps lithium-ion batteries out of collection trucks, preventing catastrophic vehicle fires | **Self-Updating HHW Hub** with item-category filter pills and roving pop-up event schedules |

👉 *For an interactive walkthrough with expanded metrics, explore the [in-app Case Study](https://curbday-sd.vercel.app/case-study).*

---

## Legacy City Tools vs. CurbDay SD

| Capability | Legacy City Portal | Official ArcGIS Map | CurbDay SD (`curbday-sd.vercel.app`) |
| :--- | :---: | :---: | :---: |
| **Mobile-First UX** | ❌ Desktop iframe | ❌ Heavy GIS map |  Tactile, responsive app (<600ms TTFB) |
| **Glanceable Status** | ❌ Raw timestamps | ❌ Complex layers |  **Curb Verdict Hero Card** with clear visual states |
| **Holiday Shift Warnings** | ❌ Static PDF link | ❌ Not available |  **Deterministic Engine** with Amber Eve alerts |
| **Unified Sweeping & Trash** | ❌ Separate |  Map only (hard on mobile) |  **Single Address Lookup** for both services |
| **Proactive Reminders** | ❌ None | ❌ None |  **Evening Email Reminders** (6:00 PM night before) |
| **Calendar Sync** | ❌ None | ❌ None |  **1-Click Dynamic `.ics` Calendar Sync** |
| **AI Waste Sorting** | ❌ 40-page PDF | ❌ Not available |  **Gemini Flash Advisor** with prep instructions |
| **Hazardous Waste Hub** | ❌ Buried webpage | ❌ Not available |  **Interactive Pop-Up Explorer** with item filters |
| **Monthly Operating Cost** | Enterprise contract | Enterprise GIS | **$0.00/mo** (Free-tier serverless edge) |

---

## Zero-Cost Architecture ($0/mo)

CurbDay SD operates on a **$0.00/month budget** with good-faith civic data consumption:

- **Frontend & Edge:** Next.js 16 (App Router, Server Components) on **Vercel Hobby** for sub-600ms edge responses.
- **Respectful Civic Caching:** External City scraping endpoints use **7-Day Incremental Static Regeneration (`revalidate: 604800`)**—querying municipal servers at most once weekly while serving all resident traffic from the edge cache.
- **Grounded AI Runtime:** **Google Gemini 1.5 Flash (Free Tier)** grounded in official City ESD rules, guarded by in-memory LRU caching and sliding-window rate limiters ([`lib/rate-limiter.ts`](lib/rate-limiter.ts)).
- **Persistence & Cron:** **Supabase PostgreSQL (Free Tier)** for subscriber storage + **Vercel Cron** with dynamic Daylight Saving Time adjustment (01:00 UTC PDT / 02:00 UTC PST) to dispatch evening reminders promptly at **6:00 PM PT** with RFC 8058 one-click unsubscribe.

---

## Getting Started

```bash
# Clone and install
git clone https://github.com/kennytbarry/CurbDay.git
cd CurbDay
npm install

# Set up environment variables
cp .env.example .env.local

# Run development server
npm run dev
```

### Running Tests
```bash
npm test        # 138 unit and integration tests (holidays, rate limits, ESD knowledge)
npm run build   # Next.js production build verification
```

---

> [!NOTE]
> **Civic Project Notice:**  
> *Independent civic project; not an official City of San Diego Environmental Services Department (ESD) application. Built in good faith using publicly accessible municipal data with respectful edge caching to help San Diego residents comply with local sanitation, recycling, and hazardous waste regulations.*

## License

[MIT License](LICENSE) © Kenny Barry. Provided "as-is" without warranty or liability.
