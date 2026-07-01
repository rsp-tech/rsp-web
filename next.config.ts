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
  disable: process.env.NODE_ENV === "development",
  exclude: [/\.map$/, /^manifest.*\.js$/, /\.rsc$/],
  additionalPrecacheEntries: [
    { url: "/", revision },
    { url: "/manifest.json", revision },
  ],
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["@/components"],
  },
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/img/:path*",
        destination: `${process.env["NEXT_PUBLIC_SUPABASE_URL"]}/storage/v1/object/public/images/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/img/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value:
              "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline' https://*.clarity.ms https://*.posthog.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://bfiyqzcnmkpczkmgounm.supabase.co https://*.clarity.ms https://c.bing.com/; media-src 'self' https://bfiyqzcnmkpczkmgounm.supabase.co; connect-src 'self' https://bfiyqzcnmkpczkmgounm.supabase.co wss://bfiyqzcnmkpczkmgounm.supabase.co https://*.posthog.com https://*.clarity.ms; font-src 'self' data:; frame-ancestors 'none'; object-src 'none';",
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
