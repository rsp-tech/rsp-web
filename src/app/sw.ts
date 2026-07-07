/// <reference lib="webworker" />

import type { PrecacheEntry, RuntimeCaching, SerwistPlugin } from "serwist";
import {
  CacheFirst,
  NetworkFirst,
  NetworkOnly,
  Route,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

// Optimized Regex Matchers for Next.js App Router Structure
const STATIC_ASSET_REGEX = /^\/_next\/static\/|\.(js|css|woff2?|ttf)$/;
const GENERAL_IMAGE_REGEX = /\.(png|jpe?g|webp|svg|ico|avif)$/;

const CRITICAL_BRAND_IMAGES = [
  "/rsp.webp",
  "/icon-192x192.webp",
  "/icon-512x512.webp",
  "/rsp.avif",
  "/icon-192x192.avif",
  "/icon-512x512.avif",
  "/favicon.ico",
];

const STRUCTURAL_PATHS = [
  "/about",
  "/contact-us",
  "/get-involved",
  "/profile",
  "/settings",
  "/queries",
  "/sitemap.xml",
];

// Thread-safe eviction engine preventing execution races
const trimCache = async (
  cacheName: string,
  maxItems: number,
): Promise<void> => {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length <= maxItems) return;

    const targets = keys.slice(0, keys.length - maxItems);
    await Promise.all(
      targets.map((key) => cache.delete(key).catch(() => false)),
    );
  } catch (error) {
    console.error(`[SW] Failed to trim cache ${cacheName}:`, error);
  }
};

const limitCacheItemsPlugin = (maxItems: number): SerwistPlugin => ({
  cacheDidUpdate: async ({ cacheName }) => {
    await trimCache(cacheName, maxItems);
  },
});

const runtimeCaching: RuntimeCaching[] = [
  {
    // 1. Next.js Client-Side Component Stream Interceptor (RSC & Prefetches)
    matcher: ({ request, url }) =>
      url.origin === self.location.origin &&
      request.mode !== "navigate" &&
      (url.searchParams.has("_rsc") || request.headers.get("RSC") === "1"),
    handler: new NetworkFirst({
      cacheName: "next-rsc-payloads",
      networkTimeoutSeconds: 1,
      plugins: [limitCacheItemsPlugin(40)],
    }),
  },
  {
    // 2. Static Assets & Dynamic Chunks (JS, CSS, Fonts)
    // Targets Next.js immutable build output securely.
    matcher: ({ request, url }) =>
      url.origin === self.location.origin &&
      STATIC_ASSET_REGEX.test(url.pathname) &&
      request.headers.get("RSC") !== "1",
    handler: new StaleWhileRevalidate({
      cacheName: "static-assets",
      plugins: [limitCacheItemsPlugin(50)],
    }),
  },
  {
    // 3. Critical Branding Assets
    matcher: ({ url }) => CRITICAL_BRAND_IMAGES.includes(url.pathname),
    handler: new CacheFirst({
      cacheName: "brand-assets",
      plugins: [limitCacheItemsPlugin(CRITICAL_BRAND_IMAGES.length * 2)],
    }),
  },
  {
    // 4. General Media & Content Images
    matcher: ({ url }) => GENERAL_IMAGE_REGEX.test(url.pathname),
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

// App Shell Router mapping strategy for document requests
const navigationRoute = new Route(
  ({ request }) => request.mode === "navigate",
  async ({ request }) => {
    const url = new URL(request.url);

    if (STRUCTURAL_PATHS.includes(url.pathname)) {
      return (await serwist.matchPrecache(url.pathname)) || Response.error();
    }

    return (await serwist.matchPrecache("/")) || Response.error();
  },
);

serwist.registerRoute(navigationRoute);
serwist.addEventListeners();
