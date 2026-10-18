# DESIGN.md — CurbDay San Diego ("Flip7 Retro-Playful")

> **Design System Specification for CurbDay San Diego**  
> Adapted from the `@yiujc/flip7-card-game` retro-playful design system on [designmd.ai](https://designmd.ai/yiujc/flip7-card-game).

---

## 1. Aesthetic Thesis & Vibe

* **The Vision:** Retro-playful, tactile, and joyful — inspired by vintage California board games, diner menus, and the Flip7 card game aesthetic. Every component feels like a high-finish physical game piece you want to tap.
* **Atmosphere:** Sun-drenched San Diego retro coastal warmth meets bold, tactile gamification. Bubbly energy, colored glow shadows, folded ribbon banners, and game-card tactile cards.
* **Tone of Voice:** Upbeat, friendly, clear, distinctly local ("Roll 'em out tonight!", "Keep gutters clear", "Curb courtesy").

---

## 2. Color Tokens & Palette

### Core Flip7 Palette
| Token Name | Hex Code | Visual Role |
| :--- | :--- | :--- |
| `flip-teal` | `#2BA8A2` | Primary brand teal, main icons, headers, progress |
| `flip-tealLight` | `#3CC4BD` | Hover accents, secondary borders |
| `flip-tealDark` | `#1E8C86` | Deep teal typography, high contrast titles |
| `flip-tealBG` | `#E8F6F5` | Subtle teal tint for input backgrounds & badges |
| `flip-gold` | `#FFD23F` | Primary CTA gold, active highlights, badges |
| `flip-goldLight` | `#FFE47A` | Soft gold glow, active pill states |
| `flip-goldDark` | `#E6B800` | Gold hover depth, border accents |
| `flip-coral` | `#EF6C4A` | Energy accent, alert states, street sweeping enforcement |
| `flip-coralLight`| `#FF8A6A` | Soft coral background tints |
| `flip-coralDark` | `#D45233` | Deep coral hover & text |
| `flip-cream` | `#FFF8E7` | Card surfaces, inputs, ribbon banners |
| `flip-sky` | `#5DADE2` | Recycling bonus highlights, secondary tags |
| `flip-surface` | `#EFF8F7` | Global canvas background |
| `flip-card` | `#FFFFFF` | Primary card background |
| `flip-dark` | `#182C2B` | Deep text ink for maximum daylight legibility |

### Curbside Cart Colors (Tactile Card-Game Tokens)
| Cart | Primary Color | Border / Left Accent | Badge Style |
| :--- | :--- | :--- | :--- |
| **Black Cart · Trash** | `#27272A` (Zinc 800) | `border-l-4 border-l-zinc-900` | Solid dark game tile, white text |
| **Green Cart · Organics** | `#059669` (Emerald 600) | `border-l-4 border-l-emerald-600` | Fresh emerald green game tile |
| **Blue Cart · Recycling** | `#2563EB` (Blue 600) | `border-l-4 border-l-blue-600` | Civic recycling blue tile |
| **Recycling (Off-Week)** | `#E2E8F0` (Slate 200) | `border-l-4 border-l-slate-300` | Dashed muted ghost tile |

---

## 3. Typography & Display Rules

* **Display & Header**: Bold chunky sans-serif (`font-extrabold` or `font-black`) with playful letter-spacing.
* **Header Badge (FLIP7 inspired)**:
  - Tilted group (`-rotate-2` or `-rotate-3`).
  - Wrapped in a cream parallelogram (`skew-x-[-6deg]`) with a crisp border and colored glow shadow.
  - "CurbDay" in primary deep teal (`#1E8C86`) with gold shadow.
  - "San Diego" in retro script or folded ribbon banner in coral/amber.
* **Section Dividers**: Playful 2px dashed borders (`border-dashed border-teal-200`).

---

## 4. Elevation & Colored Glow System

No muddy flat black shadows. All elevation uses Flip7 colored glow shadows:
* `shadow-card`: `0 4px 20px rgba(43, 168, 162, 0.12)`
* `shadow-gold-glow`: `0 4px 20px rgba(255, 210, 63, 0.45)`
* `shadow-teal-glow`: `0 4px 20px rgba(43, 168, 162, 0.35)`
* `shadow-coral-glow`: `0 4px 20px rgba(239, 108, 74, 0.35)`

---

## 5. Component Patterns

* **Cards**: Cream (`#FFF8E7`) or White (`#FFFFFF`) with `rounded-3xl`, `border-2 border-[#2BA8A2]/20`, `shadow-card`, and thick colored left accent bars (`border-l-6`).
* **Buttons & CTAs**:
  - Full pill shape (`rounded-full`), minimum 48px touch target.
  - Primary CTA: Gold gradient (`bg-gradient-to-b from-[#FFD23F] to-[#E6B800]`), deep ink text (`text-[#182C2B]`), `shadow-gold-glow`, bouncy `active:scale-95`.
* **Suggestion Chips**: Pill buttons (`rounded-full px-3.5 py-1.5`) with bounce on tap.
* **Ribbon Banners**: Folded 3D ribbon banner style for announcements and alerts.
