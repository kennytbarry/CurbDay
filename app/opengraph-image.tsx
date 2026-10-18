import fs from "fs";
import path from "path";
import { ImageResponse } from "next/og";
import TrashTruckArtwork from "@/components/TrashTruckArtwork";

export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

export const alt =
  "CurbDay San Diego · Trash, Organics, & Recycling Tracker";

export default function OpenGraphImage() {
  const fontData = fs.readFileSync(
    path.join(process.cwd(), "public/fonts/Geist-Regular.ttf")
  );

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: "#0B101D",
          backgroundImage:
            "radial-gradient(ellipse 70% 50% at 20% 0%, rgba(255,136,0,0.18), transparent), radial-gradient(ellipse 60% 50% at 85% 10%, rgba(216,27,96,0.15), transparent)",
          color: "#FAF8F5",
          fontFamily: "Geist, sans-serif",
          padding: "60px 70px",
          position: "relative",
          justifyContent: "space-between",
          boxSizing: "border-box",
        }}
      >
        {/* City Connect Top Piping Accent */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "8px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div style={{ height: "4px", backgroundColor: "#D81B60" }} />
          <div style={{ height: "4px", backgroundColor: "#FF8800" }} />
        </div>

        {/* Header Branding */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
              <span
                style={{
                  fontSize: "64px",
                  fontWeight: 900,
                  letterSpacing: "-0.03em",
                  color: "#FAF8F5",
                  textShadow: "3px 3px 0 #D81B60, 5px 5px 0 #FF8800",
                }}
              >
                CurbDay
              </span>
              <span
                style={{
                  fontSize: "44px",
                  fontWeight: 700,
                  color: "#FFB703",
                  fontStyle: "italic",
                }}
              >
                San Diego
              </span>
            </div>
            <p
              style={{
                fontSize: "26px",
                fontWeight: 700,
                color: "#BCE3F5",
                margin: "4px 0 0 0",
              }}
            >
              Trash, Organics, &amp; Recycling Tracker
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              borderRadius: "9999px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              backgroundColor: "rgba(255, 255, 255, 0.05)",
              color: "#FAF8F5",
              fontSize: "18px",
              fontWeight: 700,
            }}
          >
            <span>curbday-sd.vercel.app</span>
          </div>
        </div>

        {/* Content Body: Feature Badges on Left, Truck Vector on Right */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "20px" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              maxWidth: "560px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 20px",
                borderRadius: "16px",
                backgroundColor: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.12)",
                fontSize: "20px",
                fontWeight: 700,
                color: "#FAF8F5",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FAF8F5" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2" />
                <path d="M15 18H9" />
                <path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14" />
                <circle cx="17" cy="18" r="2" />
                <circle cx="7" cy="18" r="2" />
              </svg>
              <span>Weekly Trash &amp; SB 1383 Organics Schedules</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 20px",
                borderRadius: "16px",
                backgroundColor: "rgba(37, 99, 235, 0.15)",
                border: "1px solid rgba(59, 130, 246, 0.35)",
                fontSize: "20px",
                fontWeight: 700,
                color: "#93C5FD",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#60A5FA" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
                <path d="M11 19h8.2a1.8 1.8 0 0 0 1.7-1.25 1.8 1.8 0 0 0-.4-1.95L17.5 12" />
                <path d="m14 7 3-3 3 3" />
                <path d="M17 4v5" />
              </svg>
              <span>Bi-Weekly Blue Cart Recycling Calendars</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 20px",
                borderRadius: "16px",
                backgroundColor: "rgba(255, 136, 0, 0.14)",
                border: "1px solid rgba(255, 183, 3, 0.35)",
                fontSize: "20px",
                fontWeight: 700,
                color: "#FDE047",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#FBBF24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="4" rx="2" />
                <path d="M16 2v4" />
                <path d="M8 2v4" />
                <path d="M3 10h18" />
              </svg>
              <span>Automated 5-Holiday Slide Delay Alerts (+1 Day)</span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                padding: "14px 20px",
                borderRadius: "16px",
                backgroundColor: "rgba(216, 27, 96, 0.14)",
                border: "1px solid rgba(236, 37, 110, 0.35)",
                fontSize: "20px",
                fontWeight: 700,
                color: "#F472B6",
              }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#F472B6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
              </svg>
              <span>Miramar &amp; Saturday Pop-Up Drop-Off Directory</span>
            </div>
          </div>

          {/* Truck Artwork Container */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "480px",
              height: "290px",
            }}
          >
            <TrashTruckArtwork className="w-full h-full" />
          </div>
        </div>

        {/* Footer Accent */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            paddingTop: "14px",
            borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            color: "rgba(188, 227, 245, 0.7)",
            fontSize: "16px",
            fontWeight: 600,
          }}
        >
          <span>City of San Diego Environmental Services Department (ESD) Rules</span>
          <span>Instant .ics Calendar Export · Waste Sorter AI Guide</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: "Geist",
          data: fontData,
          style: "normal",
          weight: 400,
        },
      ],
    }
  );
}
