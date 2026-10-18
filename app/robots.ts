import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
      },
      {
        userAgent: [
          "GPTBot",
          "OAI-SearchBot",
          "ClaudeBot",
          "PerplexityBot",
          "Google-Extended",
          "ChatGPT-User",
          "Applebot-Extended",
        ],
        allow: "/",
      },
    ],
    sitemap: "https://curbday-sd.vercel.app/sitemap.xml",
  };
}
