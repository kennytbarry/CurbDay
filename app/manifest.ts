import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "CurbDay San Diego",
    short_name: "CurbDay",
    description:
      "Instant City of San Diego curbside pickup schedules (Trash, Blue Cart Recycling, Green Cart Organics), holiday delay alerts, and hazardous waste drop-off tracker.",
    start_url: "/",
    display: "standalone",
    background_color: "#0B101D",
    theme_color: "#0B101D",
    orientation: "portrait",
    categories: ["utilities", "lifestyle"],
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
