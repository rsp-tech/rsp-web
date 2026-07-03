"use client";

import { getAssetUrl, getAudioUrl } from "./storage";

export interface CacheSettings {
  autoCacheOnDownload: boolean;
  maxCacheSizeMB: number;
}

export interface CacheEntry {
  recId: number;
  audioId: string;
  size: number;
  accessedAt: number;
}

export interface StorageEstimateInfo {
  quotaMB: number;
  usageMB: number;
  freeMB: number;
}

const CACHE_NAME = "rsp-audio-cache";
const SETTINGS_KEY = "rsp-audio-settings";
const LRU_KEY = "rsp-audio-lru";

export const DEFAULT_SETTINGS: CacheSettings = {
  autoCacheOnDownload: true,
  maxCacheSizeMB: 200, // 200 MB minimum default
};

export const getCacheSettings = (): CacheSettings => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    return saved
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      : DEFAULT_SETTINGS;
  } catch (e) {
    console.error("Failed to read cache settings:", e);
    return DEFAULT_SETTINGS;
  }
};

export const setCacheSettings = (settings: Partial<CacheSettings>): void => {
  if (typeof window === "undefined") return;
  try {
    const current = getCacheSettings();
    const updated = { ...current, ...settings };
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));

    // Trigger eviction immediately in case the size limit was reduced
    enforceLruLimit();
  } catch (e) {
    console.error("Failed to save cache settings:", e);
  }
};

export const getLruEntries = (): CacheEntry[] => {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(LRU_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    console.error("Failed to read LRU entries:", e);
    return [];
  }
};

const saveLruEntries = (entries: CacheEntry[]): void => {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LRU_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error("Failed to save LRU entries:", e);
  }
};

export const getStorageEstimate =
  async (): Promise<StorageEstimateInfo | null> => {
    if (typeof window === "undefined" || !navigator.storage?.estimate)
      return null;
    try {
      const estimate = await navigator.storage.estimate();
      const quota = estimate.quota || 0;
      const usage = estimate.usage || 0;
      const free = quota - usage;

      return {
        quotaMB: Math.round(quota / (1024 * 1024)),
        usageMB: Math.round(usage / (1024 * 1024)),
        freeMB: Math.round(free / (1024 * 1024)),
      };
    } catch (e) {
      console.error("Failed to get storage estimate:", e);
      return null;
    }
  };

export const isAudioCached = async (audioId: string): Promise<boolean> => {
  if (typeof window === "undefined" || !("caches" in window)) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const url = getAudioUrl(audioId);
    const response = await cache.match(url);
    return !!response;
  } catch (e) {
    console.error("Failed to check if audio is cached:", e);
    return false;
  }
};

export const getCachedBlob = async (audioId: string): Promise<Blob | null> => {
  if (typeof window === "undefined" || !("caches" in window)) return null;
  try {
    const cache = await caches.open(CACHE_NAME);
    const url = getAudioUrl(audioId);
    const response = await cache.match(url);
    if (!response) return null;

    // Update LRU accessed time
    updateLruAccess(audioId);

    return await response.blob();
  } catch (e) {
    console.error("Failed to get cached blob:", e);
    return null;
  }
};

export const cacheAudioFile = async (
  recId: number,
  audioId: string,
): Promise<boolean> => {
  if (typeof window === "undefined" || !("caches" in window)) return false;

  try {
    const url = getAssetUrl(audioId);
    const cache = await caches.open(CACHE_NAME);

    // Check if already cached
    const existing = await cache.match(url);
    if (existing) {
      updateLruAccess(audioId);
      return true;
    }

    // Fetch the file
    const response = await fetch(url);
    if (!response.ok)
      throw new Error(`Fetch failed with status ${response.status}`);

    const clone = response.clone();

    let size = 0;
    const contentLength = response.headers.get("content-length");
    if (contentLength) {
      size = parseInt(contentLength, 10);
    } else {
      const blob = await clone.blob();
      size = blob.size;
    }

    // Put in cache
    await cache.put(url, response);

    // Record LRU entry
    const entries = getLruEntries();
    const existingIndex = entries.findIndex((e) => e.audioId === audioId);

    const newEntry: CacheEntry = {
      recId,
      audioId,
      size,
      accessedAt: Date.now(),
    };

    if (existingIndex > -1) {
      entries[existingIndex] = newEntry;
    } else {
      entries.push(newEntry);
    }

    saveLruEntries(entries);

    // Enforce limits
    await enforceLruLimit();

    return true;
  } catch (e) {
    console.error("Failed to cache audio file:", e);
    return false;
  }
};

export const deleteCachedAudio = async (audioId: string): Promise<boolean> => {
  if (typeof window === "undefined" || !("caches" in window)) return false;
  try {
    const cache = await caches.open(CACHE_NAME);
    const url = getAssetUrl(audioId);
    const deleted = await cache.delete(url);

    if (deleted) {
      const entries = getLruEntries();
      const updated = entries.filter((e) => e.audioId !== audioId);
      saveLruEntries(updated);
    }

    return deleted;
  } catch (e) {
    console.error("Failed to delete cached audio:", e);
    return false;
  }
};

export const clearAllAudioCache = async (): Promise<void> => {
  if (typeof window === "undefined" || !("caches" in window)) return;
  try {
    await caches.delete(CACHE_NAME);
    saveLruEntries([]);
  } catch (e) {
    console.error("Failed to clear audio cache:", e);
  }
};

export const updateLruAccess = (audioId: string): void => {
  const entries = getLruEntries();
  const index = entries.findIndex((e) => e.audioId === audioId);
  if (index > -1) {
    entries[index].accessedAt = Date.now();
    saveLruEntries(entries);
  }
};

export const enforceLruLimit = async (): Promise<void> => {
  if (typeof window === "undefined" || !("caches" in window)) return;
  try {
    const settings = getCacheSettings();
    const limitBytes = settings.maxCacheSizeMB * 1024 * 1024;
    const entries = getLruEntries();

    let totalSize = entries.reduce((acc, curr) => acc + curr.size, 0);
    if (totalSize <= limitBytes) return;

    // Evict down to low watermark (80% of size settings limit)
    const lowWatermarkBytes = limitBytes * 0.8;

    // Sort oldest first
    const sorted = [...entries].sort((a, b) => a.accessedAt - b.accessedAt);
    const cache = await caches.open(CACHE_NAME);

    const keepEntries: CacheEntry[] = [];

    for (const entry of sorted) {
      if (totalSize > lowWatermarkBytes) {
        const url = getAssetUrl(entry.audioId);
        await cache.delete(url);
        totalSize -= entry.size;
      } else {
        keepEntries.push(entry);
      }
    }

    saveLruEntries(keepEntries);
  } catch (e) {
    console.error("Failed to enforce LRU limit:", e);
  }
};
