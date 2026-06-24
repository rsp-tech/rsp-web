/// <reference lib="webworker" />

import type {
  PrecacheEntry,
  RouteHandlerCallbackOptions,
  RouteMatchCallbackOptions,
  RuntimeCaching,
  SerwistPlugin,
} from "serwist";
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
const GENERAL_IMAGE_REGEX = /\.(png|jpe?g|webp|svg|ico)$/;

const CRITICAL_BRAND_IMAGES = [
  "rsp.webp",
  "icon-192x192.webp",
  "icon-512x512.webp",
  "favicon.ico",
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
    // 1. Static Assets (Scripts, Styles, Fonts)
    matcher: ({ request, url }) =>
      STATIC_ASSET_REGEX.test(url.pathname) &&
      !FORBIDDEN_STATIC_REGEX.test(url.pathname) &&
      request.headers.get("RSC") !== "1",
    handler: new StaleWhileRevalidate({
      cacheName: "static-assets",
      plugins: [limitCacheItemsPlugin(50)],
    }),
  },
  {
    // 2. Critical Branding Assets (Force Cache-First for Offline/PWA)
    matcher: ({ url }) => CRITICAL_BRAND_IMAGES.includes(url.pathname),
    handler: new CacheFirst({
      cacheName: "brand-assets",
      plugins: [limitCacheItemsPlugin(CRITICAL_BRAND_IMAGES.length * 2)],
    }),
  },
  {
    // 3. General Images (Network Only - Relies on native browser HTTP Cache-Control)
    matcher: ({ url }) => GENERAL_IMAGE_REGEX.test(url.pathname),
    handler: new NetworkOnly(),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
});

// App Shell fallback strategy for navigation requests
const navigationRoute = new Route(
  ({ request }: RouteMatchCallbackOptions) => request.mode === "navigate",
  async ({ request }: RouteHandlerCallbackOptions) => {
    try {
      return await fetch(request);
    } catch (error) {
      const cached = await serwist.matchPrecache("/");
      if (cached) return cached;
      throw error;
    }
  },
);

serwist.registerRoute(navigationRoute);
serwist.addEventListeners();
