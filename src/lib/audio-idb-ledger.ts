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
  const tx = db?.transaction(STORE_NAME, "readwrite");
  const entry: AudioCacheLedgerEntry = {
    id: audioId,
    recId,
    size,
    accessedAt: Date.now(),
  };
  tx?.store.put(entry);
  await tx?.done;
};

export const enforceLRUWatermark = async (limitMB?: number): Promise<void> => {
  const db = await getDB();
  const limit = limitMB ?? getAudioCacheSettings().maxCacheSizeMB;
  const limitBytes = limit * 1024 * 1024;

  const entries = ((await db?.getAll(STORE_NAME)) ??
    []) as AudioCacheLedgerEntry[];

  // Sort oldest first (lowest timestamp) for Least Recently Used eviction
  entries.sort((a, b) => a.accessedAt - b.accessedAt);
  let currentSize = entries.reduce((acc, curr) => acc + curr.size, 0);
  if (currentSize <= limitBytes) return;

  const targetSize = limitBytes * 0.8; // 80% Low Watermark Headroom
  const cache = await caches.open(AUDIO_CACHE_NAME);

  const tx = db?.transaction(STORE_NAME, "readwrite");
  for (const entry of entries) {
    if (currentSize <= targetSize) break;

    // Delete both from Browser Cache Storage and our Metadata database
    await cache.delete(entry.id);

    await tx?.store.delete(entry.id);

    currentSize -= entry.size;
  }
};
