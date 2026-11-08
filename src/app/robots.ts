import type { MetadataRoute } from "next";

const DISALLOWED_PATHS = [
  "/api/",
  "/health",
  "/healthz",
  "/profile",
  "/settings",
  "/wp-admin",
  "/wp-login",
  "/wp-content",
  "/ipfs",
  "/*.php$",
];

const robots = (): MetadataRoute.Robots => {
  return {
    rules: [
      {
        userAgent: [
          // Commercial scrapers and bots that do not drive search or answer traffic
          "SemrushBot",
          "SemrushBot-SA",
          "AhrefsBot",
          "DotBot",
          "PetalBot",
          "Bytespider",
          "Amazonbot",
          "MJ12bot",
          "DataForSeoBot",
          "BLEXBot",
        ],
        disallow: "/",
      },
      {
        userAgent: [
          // Search engines (SEO)
          "Googlebot",
          "bingbot",
          "YandexBot",
          "DuckDuckBot",
          "Baiduspider",
          // AI Search & Answer engines (AEO)
          "GPTBot",
          "ChatGPT-User",
          "PerplexityBot",
          "ClaudeBot",
          "Applebot",
          "Google-Extended",
        ],
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
      {
        userAgent: "*",
        allow: "/",
        disallow: DISALLOWED_PATHS,
      },
    ],
    sitemap: "https://radheshyamdas.com/sitemap.xml",
  };
};

export default robots;
