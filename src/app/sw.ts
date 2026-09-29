/// <reference lib="webworker" />

import type { PrecacheEntry, RuntimeCaching } from "serwist";
import {
  CacheFirst,
  ExpirationPlugin,
  NetworkFirst,
  NetworkOnly,
  Route,
  Serwist,
} from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

// Immutable Next.js build assets only.
const STATIC_ASSET_REGEX = /^\/_next\/static\//;
const NETWORK_ONLY_REGEX = /^\/api|\.(png|jpe?g|webp|svg|ico|avif|zip|xml)$/;

const CRITICAL_BRAND_IMAGES = [
  "/rsp.webp",
  "/rsp.avif",
  "/icon-192x192.webp",
  "/icon-192x192.avif",
  "/icon-512x512.webp",
  "/icon-512x512.avif",
  "/favicon.ico",
];

const STRUCTURAL_PATHS = [
  "/",
  "/about",
  "/contact-us",
  "/get-involved",
  "/profile",
  "/settings",
  "/queries",
];

const runtimeCaching: RuntimeCaching[] = [
  {
    // Next.js RSC payloads & client-side prefetches.
    matcher: ({ request, url }) =>
      url.origin === self.location.origin &&
      request.mode !== "navigate" &&
      (url.searchParams.has("_rsc") || request.headers.get("RSC") === "1"),
    handler: new NetworkFirst({
      cacheName: "next-rsc-payloads",
      networkTimeoutSeconds: 2,
      plugins: [
        new ExpirationPlugin({
          maxEntries: 60,
          maxAgeFrom: "last-used",
        }),
      ],
    }),
  },
  {
    // Fingerprinted Next.js assets (immutable content hashes; serve from cache without revalidating over network).
    matcher: ({ request, url }) =>
      url.origin === self.location.origin &&
      STATIC_ASSET_REGEX.test(url.pathname) &&
      request.headers.get("RSC") !== "1",
    handler: new CacheFirst({
      cacheName: "static-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 120,
          maxAgeSeconds: 7 * 24 * 60 * 60,
        }),
      ],
    }),
  },
  {
    // Critical branding assets.
    matcher: ({ url }) => CRITICAL_BRAND_IMAGES.includes(url.pathname),
    handler: new CacheFirst({
      cacheName: "brand-assets",
      plugins: [
        new ExpirationPlugin({
          maxEntries: CRITICAL_BRAND_IMAGES.length * 2,
        }),
      ],
    }),
  },
  {
    // General content images/xml/zip and api routes are always fetched from the network - we already have cache-control headers.
    matcher: ({ url }) => NETWORK_ONLY_REGEX.test(url.pathname),
    handler: new NetworkOnly(),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: false,
  runtimeCaching,
});

const navigationRoute = new Route(
  ({ request }) => request.mode === "navigate",
  async ({ request }) => {
    const { pathname } = new URL(request.url);

    try {
      // Dedicated SSG/ISR pages.
      if (STRUCTURAL_PATHS.includes(pathname)) {
        return (
          (await serwist.matchPrecache(pathname)) ?? (await fetch(request))
        );
      }

      /**
       * Dynamic [[...slug]] pages intentionally share the root app shell.
       *
       * Avoids all server calls for /library/ category pages.
       * User navigations reuse the precached "/" shell with zero network roundtrips,
       * and page content is restored entirely on the client from IndexedDB.
       */
      return (await serwist.matchPrecache("/")) ?? (await fetch(request));
    } catch {
      return fetch(request);
    }
  },
);

serwist.registerRoute(navigationRoute);
serwist.addEventListeners();
