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
        destination: "/api/img/:path*",
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
            value: `default-src 'self'; script-src 'self'${process.env.NODE_ENV === "development" ? " 'unsafe-eval'" : ""} 'unsafe-inline' https://rsp.mayankchaudhari.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https://lh3.googleusercontent.com https://i.ytimg.com; media-src 'self' blob: ${process.env["NEXT_PUBLIC_AUDIO_BASE_URL"]}; connect-src 'self' ${process.env["NEXT_PUBLIC_AUDIO_BASE_URL"]} https://bfiyqzcnmkpczkmgounm.supabase.co wss://bfiyqzcnmkpczkmgounm.supabase.co https://rsp.mayankchaudhari.com ${process.env["NEXT_PUBLIC_ASSET_BASE_URL"]?.split("?")[0]}; font-src 'self' data:; frame-src 'self' https://www.youtube-nocookie.com https://www.youtube.com https://drive.google.com; frame-ancestors 'none'; object-src 'none';`,
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
