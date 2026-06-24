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
  /* config options here */
  reactCompiler: true,
  images: {
    unoptimized: true,
  },
  async rewrites() {
    return [
      {
        source: "/img/:path*",
        destination: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/images/:path*`,
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
    ];
  },
};

export default withSerwist(nextConfig);
