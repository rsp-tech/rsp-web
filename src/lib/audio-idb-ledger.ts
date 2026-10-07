import { AUDIO_CACHE_NAME, STORE } from "@/constants";
import type { AudioCacheLedgerEntry } from "@/types";
import { getAudioCacheSettings } from "../hooks/use-audio-cache";
import { getDB } from "./idb";

const STORE_NAME = STORE.CACHE_LEDGER;

export const touchTrackMeta = async (
  audioId: string,
  recId: number,
  size: number,
): Promise<void> => {
  const db = await getDB();
  if (!db) return;

  const entry: AudioCacheLedgerEntry = {
    id: audioId,
    recId,
    size,
    accessedAt: Date.now(),
  };

  if (typeof db.put === "function") {
    await db.put(STORE_NAME, entry);
  } else {
    const tx = db.transaction(STORE_NAME, "readwrite");
    tx.store.put(entry);
    await tx.done;
  }
};

export const enforceLRUWatermark = async (limitMB?: number): Promise<void> => {
  const db = await getDB();
  if (!db) return;

  const limit = limitMB ?? getAudioCacheSettings().maxCacheSizeMB;
  const limitBytes = limit * 1024 * 1024;

  const entries = ((await db.getAll(STORE_NAME)) ??
    []) as AudioCacheLedgerEntry[];

  // Sort oldest first (lowest timestamp) for Least Recently Used eviction
  entries.sort((a, b) => a.accessedAt - b.accessedAt);
  let currentSize = entries.reduce((acc, curr) => acc + curr.size, 0);
  if (currentSize <= limitBytes) return;

  const targetSize = limitBytes * 0.8; // 80% Low Watermark Headroom

  // 1. Identify which entries need to be evicted
  const entriesToEvict: AudioCacheLedgerEntry[] = [];
  for (const entry of entries) {
    if (currentSize <= targetSize) break;
    entriesToEvict.push(entry);
    currentSize -= entry.size;
  }

  if (entriesToEvict.length === 0) return;

  // 2. Delete from Browser Cache Storage (separate async Cache API)
  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await caches.open(AUDIO_CACHE_NAME);
      await Promise.all(entriesToEvict.map((entry) => cache.delete(entry.id)));
    } catch (err) {
      console.warn("Failed to delete entries from audio cache", err);
    }
  }

  // 3. Delete from IndexedDB metadata ledger in a clean, self-contained transaction
  const tx = db.transaction(STORE_NAME, "readwrite");
  for (const entry of entriesToEvict) {
    tx.store.delete(entry.id);
  }
  await tx.done;
};
