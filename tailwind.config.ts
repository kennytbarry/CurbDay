import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "var(--font-sans)",
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        cursive: [
          '"Brush Script MT"',
          '"Snell Roundhand"',
          '"Apple Chancery"',
          '"Segoe Script"',
          "cursive",
        ],
      },
      colors: {
        flip: {
          teal: "#2BA8A2",
          tealLight: "#3CC4BD",
          tealDark: "#1E8C86",
          tealBG: "#E8F6F5",
          gold: "#FFD23F",
          goldLight: "#FFE47A",
          goldDark: "#E6B800",
          coral: "#EF6C4A",
          coralLight: "#FF8A6A",
          coralDark: "#D45233",
          cream: "#FFF8E7",
          creamDark: "#F7ECCF",
          sky: "#5DADE2",
          surface: "#EFF8F7",
          card: "#FFFFFF",
          dark: "#142826",
          ink: "#0D1B1A",
          slate: "#4A6B69",
        },
        cc: {
          navy: "#0B101D",
          navyMid: "#131C31",
          navyLight: "#1E2942",
          marigold: "#FF8800",
          marigoldDeep: "#E66A00",
          gold: "#FFB703",
          magenta: "#D81B60",
          magentaBright: "#EC256E",
          sky: "#BCE3F5",
          bone: "#FAF8F5",
        },
        bin: {
          trash: {
            bg: "#18181b",
            border: "#09090b",
            text: "#ffffff",
          },
          organics: {
            bg: "#047857",
            border: "#065f46",
            text: "#ffffff",
          },
          recycling: {
            bg: "#2563eb",
            border: "#1d4ed8",
            text: "#ffffff",
          },
        },
      },
      boxShadow: {
        "flip-card": "0 4px 20px rgba(43, 168, 162, 0.12)",
        "flip-card-hover": "0 8px 30px rgba(43, 168, 162, 0.20)",
        "flip-teal-glow": "0 4px 20px rgba(43, 168, 162, 0.35)",
        "flip-gold-glow": "0 4px 20px rgba(255, 210, 63, 0.45)",
        "flip-coral-glow": "0 4px 20px rgba(239, 108, 74, 0.35)",
        "flip-sky-glow": "0 4px 16px rgba(93, 173, 226, 0.35)",
      },
    },
  },
  plugins: [],
};

export default config;
