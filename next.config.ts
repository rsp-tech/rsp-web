import { spawnSync } from "node:child_process";
import crypto from "node:crypto";
import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const revision =
  spawnSync("git", ["rev-parse", "HEAD"], {
    encoding: "utf-8",
  }).stdout?.trim() || crypto.randomUUID();

const withSerwist = withSerwistInit({
  swSrc: "src/app/sw.ts",
  swDest: "public/sw.js",
  exclude: [/\.map$/, /^manifest.*\.js$/, /\.rsc$/],
  additionalPrecacheEntries: [
    { url: "/", revision },
    { url: "/settings", revision },
    { url: "/manifest.json", revision },
  ],
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  cacheComponents: true,
  partialPrefetching: true,
  cacheLife: {
    days: {
      stale: 86400,
      revalidate: 86400,
      expire: 604800,
    },
    month: {
      stale: 2592000,
      revalidate: 2592000,
      expire: 5184000,
    },
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["@/components"],
  },
  images: {
    unoptimized: true,
  },

  async headers() {
    return [
      {
        source: "/assets/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, s-maxage=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              [
                "script-src",
                "'self'",
                process.env.NODE_ENV === "development" ? "'unsafe-eval'" : "",
                "'unsafe-inline'",
                "https://*.radheshyamdas.com",
                "https://static.cloudflareinsights.com",
              ]
                .filter(Boolean)
                .join(" "),
              "style-src 'self' 'unsafe-inline'",
              [
                "img-src",
                "'self'",
                "data:",
                "blob:",
                "https://lh3.googleusercontent.com",
                "https://i.ytimg.com",
                process.env["NEXT_PUBLIC_ASSET_PROXY"],
              ]
                .filter(Boolean)
                .join(" "),
              `media-src 'self' blob: ${process.env["NEXT_PUBLIC_ASSET_PROXY"]}`,
              [
                "connect-src",
                "'self'",
                "https://bfiyqzcnmkpczkmgounm.supabase.co",
                "https://cloudflareinsights.com",
                "wss://bfiyqzcnmkpczkmgounm.supabase.co",
                "https://*.radheshyamdas.com",
                process.env["NEXT_PUBLIC_ASSET_PROXY"],
                "https://*.google.com",
                "https://*.googleusercontent.com",
              ]
                .filter(Boolean)
                .join(" "),
              "font-src 'self' data:",
              "frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://*.google.com",
              "frame-ancestors 'self'",
              "object-src 'none'",
            ].join("; "),
          },
          {
            key: "Cross-Origin-Opener-Policy",
            value: "same-origin",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
