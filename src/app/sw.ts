/// <reference lib="webworker" />

import type { PrecacheEntry, RuntimeCaching, SerwistPlugin } from "serwist";
import {
  CacheFirst,
  NetworkOnly,
  Route,
  Serwist,
  StaleWhileRevalidate,
} from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

// Optimized Regex Matchers
const STATIC_ASSET_REGEX = /^\/_next\/static\/|\.(js|css|woff2?|ttf)$/;
const FORBIDDEN_STATIC_REGEX = /\/_next\/data|\.(json|mp3|wav|pdf)$/;
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
];

// Concurrency-optimized eviction engine
const trimCache = async (
  cacheName: string,
  maxItems: number,
): Promise<void> => {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();

    if (keys.length > maxItems) {
      const deletePromises = keys
        .slice(0, keys.length - maxItems)
        .map((key) => cache.delete(key));

      await Promise.all(deletePromises);
    }
  } catch (error) {
    console.error(`Failed to trim cache ${cacheName}:`, error);
  }
};

const limitCacheItemsPlugin = (maxItems: number): SerwistPlugin => ({
  cacheDidUpdate: async ({ cacheName }) => {
    await trimCache(cacheName, maxItems);
  },
});

const runtimeCaching: RuntimeCaching[] = [
  {
    // 1. Next.js Client-Side Component Stream & Prefetch Interceptor
    matcher: ({ request, url }) =>
      url.origin === self.location.origin &&
      (url.searchParams.has("_rsc") ||
        request.headers.get("RSC") === "1" ||
        url.pathname.includes("/_next/data/")),
    handler: new StaleWhileRevalidate({
      cacheName: "next-rsc-payloads",
      plugins: [
        limitCacheItemsPlugin(40),
        {
          // Prevents long network timeouts when navigation prefetch elements hang offline
          requestWillFetch: async ({ request }) => {
            const controller = new AbortController();
            setTimeout(() => controller.abort(), 1000);
            return new Request(request, { signal: controller.signal });
          },
        },
      ],
    }),
  },
  {
    // 2. Static Assets (Scripts, Styles, Fonts)
    matcher: ({ request, url }) =>
      url.origin === self.location.origin &&
      STATIC_ASSET_REGEX.test(url.pathname) &&
      !FORBIDDEN_STATIC_REGEX.test(url.pathname) &&
      request.headers.get("RSC") !== "1",
    handler: new StaleWhileRevalidate({
      cacheName: "static-assets",
      plugins: [limitCacheItemsPlugin(50)],
    }),
  },
  {
    // 3. Critical Branding Assets (Force Cache-First for Offline/PWA)
    matcher: ({ url }) => CRITICAL_BRAND_IMAGES.includes(url.pathname),
    handler: new CacheFirst({
      cacheName: "brand-assets",
      plugins: [limitCacheItemsPlugin(CRITICAL_BRAND_IMAGES.length * 2)],
    }),
  },
  {
    // 4. General Images (Network Only - Relies on native browser HTTP Cache-Control)
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

    // Structural client shells served directly out of precache
    if (STRUCTURAL_PATHS.includes(url.pathname)) {
      return (await serwist.matchPrecache(url.pathname)) || Response.error();
    }

    // Rewrite all categories/slug views instantly to the main cached layout shell
    return (await serwist.matchPrecache("/")) || Response.error();
  },
);

serwist.registerRoute(navigationRoute);
serwist.addEventListeners();
