/// <reference lib="webworker" />

import type {
  PrecacheEntry,
  RouteHandlerCallbackOptions,
  RouteMatchCallbackOptions,
  RuntimeCaching,
  SerwistPlugin,
} from "serwist";
import { CacheFirst, Route, Serwist, StaleWhileRevalidate } from "serwist";

declare const self: ServiceWorkerGlobalScope & {
  __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
};

// Memory-Safe Eviction Engine: iterative batch cache-eviction utility
async function trimCache(cacheName: string, maxItems: number) {
  try {
    const cache = await caches.open(cacheName);
    const keys = await cache.keys();
    if (keys.length > maxItems) {
      const toDeleteCount = keys.length - maxItems;
      for (let i = 0; i < toDeleteCount; i++) {
        await cache.delete(keys[i]);
      }
    }
  } catch (error) {
    console.error(`Failed to trim cache ${cacheName}:`, error);
  }
}

const limitCacheItemsPlugin = (cacheName: string, maxItems: number): SerwistPlugin => ({
  cacheDidUpdate: async ({ cacheName: updatedCacheName }) => {
    if (updatedCacheName === cacheName) {
      await trimCache(cacheName, maxItems);
    }
  },
});

const runtimeCaching: RuntimeCaching[] = [
  {
    // Match local scripts, styles, and web workers (but not RSC payloads, metadata, or media)
    matcher: ({ request, url }) => {
      const isStaticAsset =
        url.pathname.startsWith("/_next/static/") ||
        url.pathname.endsWith(".js") ||
        url.pathname.endsWith(".css") ||
        url.pathname.endsWith(".woff2") ||
        url.pathname.endsWith(".woff") ||
        url.pathname.endsWith(".ttf");

      const isForbidden =
        request.headers.get("RSC") === "1" ||
        url.pathname.includes("_next/data") ||
        url.pathname.includes(".json") ||
        url.pathname.endsWith(".mp3") ||
        url.pathname.endsWith(".wav") ||
        url.pathname.endsWith(".pdf");

      return isStaticAsset && !isForbidden;
    },
    handler: new StaleWhileRevalidate({
      cacheName: "static-assets",
      plugins: [limitCacheItemsPlugin("static-assets", 50)],
    }),
  },
  {
    // Match local images and icons (but not audio or documents)
    matcher: ({ url }) => {
      const isImg =
        url.pathname.endsWith(".png") ||
        url.pathname.endsWith(".jpg") ||
        url.pathname.endsWith(".jpeg") ||
        url.pathname.endsWith(".webp") ||
        url.pathname.endsWith(".svg") ||
        url.pathname.endsWith(".ico");

      const isAudioOrBinary =
        url.pathname.endsWith(".mp3") ||
        url.pathname.endsWith(".wav") ||
        url.pathname.endsWith(".pdf");

      return isImg && !isAudioOrBinary;
    },
    handler: new CacheFirst({
      cacheName: "images",
      plugins: [limitCacheItemsPlugin("images", 30)],
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching,
});

// Custom route for navigation requests (App Shell fallback)
const navigationRoute = new Route(
  ({ request }: RouteMatchCallbackOptions) => request.mode === "navigate",
  async ({ request }: RouteHandlerCallbackOptions) => {
    // If offline, instantly return the pre-cached "/"
    if (!self.navigator.onLine) {
      const cached = await serwist.matchPrecache("/");
      if (cached) return cached;
    }

    try {
      return await fetch(request);
    } catch (error) {
      // Fallback to "/" on network failure (e.g. offline, server down)
      const cached = await serwist.matchPrecache("/");
      if (cached) return cached;
      throw error;
    }
  },
);

serwist.registerRoute(navigationRoute);

serwist.addEventListeners();
