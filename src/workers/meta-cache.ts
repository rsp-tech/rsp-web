export interface CachedSyncMeta {
  serverMeta: Record<string, string>;
  publicFeatureFlags?: string[];
  cachedAt: number;
}

export const SYNC_META_TTL_MS = 30_000; // 30 seconds

const CACHE_NAME = "rsp-sync-meta-cache";

let inFlightPromise: Promise<CachedSyncMeta> | null = null;
let memoryCache: CachedSyncMeta | null = null;

const parseSyncMeta = (
  json: Record<string, unknown>,
  cachedAt: number,
): CachedSyncMeta => {
  const { public_feature_flags, ...serverMeta } = json;

  return {
    serverMeta: serverMeta as Record<string, string>,
    publicFeatureFlags: Array.isArray(public_feature_flags)
      ? (public_feature_flags as string[])
      : undefined,
    cachedAt,
  };
};

const getCache = async (): Promise<Cache | null> => {
  if (typeof self === "undefined" || typeof self.caches === "undefined") {
    return null;
  }

  try {
    return await self.caches.open(CACHE_NAME);
  } catch {
    return null;
  }
};

export const clearSyncMetaCache = () => {
  inFlightPromise = null;
  memoryCache = null;
};

export const fetchSyncMeta = async (
  origin: string,
): Promise<CachedSyncMeta> => {
  const now = Date.now();
  const cacheKey = `${origin}/api/sync/meta`;

  // In-memory cache hit
  if (memoryCache && now - memoryCache.cachedAt < SYNC_META_TTL_MS) {
    return memoryCache;
  }

  // Deduplicate concurrent requests
  if (inFlightPromise) {
    return inFlightPromise;
  }

  // Fresh network/shared cache fetch with in-flight deduplication
  inFlightPromise = (async () => {
    const cache = await getCache();

    if (cache) {
      try {
        const cachedResponse = await cache.match(cacheKey);

        if (cachedResponse) {
          const cachedAt = Number(
            cachedResponse.headers.get("x-rsp-cached-at"),
          );

          if (Number.isFinite(cachedAt) && now - cachedAt < SYNC_META_TTL_MS) {
            const json = (await cachedResponse.json()) as Record<
              string,
              unknown
            >;

            const result = parseSyncMeta(json, cachedAt);
            memoryCache = result;

            return result;
          }

          // Remove expired or invalid entries
          await cache.delete(cacheKey);
        }
      } catch {
        // Ignore Cache API errors and proceed to network fetch
      }
    }
    try {
      const res = await fetch(cacheKey);

      if (!res.ok) {
        throw new Error(
          `Failed to fetch sync meta: ${res.status} ${res.statusText}`,
        );
      }

      const json = (await res.json()) as Record<string, unknown>;
      const result = parseSyncMeta(json, Date.now());

      memoryCache = result;

      // Persist raw API response for reuse across worker instances / tabs
      if (cache) {
        try {
          await cache.put(
            cacheKey,
            new Response(JSON.stringify(json), {
              headers: {
                "Content-Type": "application/json",
                "x-rsp-cached-at": String(result.cachedAt),
              },
            }),
          );
        } catch {
          // Ignore cache persistence errors
        }
      }

      return result;
    } finally {
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
};
