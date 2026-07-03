"use client";

import { HardDrive, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { STORE } from "@/constants";
import { getDB } from "@/lib/idb";

interface CacheSettings {
  autoCacheOnPlay: boolean;
  autoCacheOnDownload: boolean;
  maxCacheSizeMB: number;
}

interface EnrichedCacheEntry {
  audioId: string;
  recId: string;
  sizeBytes: number;
  lastAccessed: number;
  name: string;
  speakers: string;
}

const CACHE_NAME = "rsp-audio-cache";
const DB_NAME = "audio_metadata_db";
const STORE_NAME = "cache_ledger";

export function AudioCacheSettings() {
  const [settings, setSettingsState] = useState<CacheSettings>({
    autoCacheOnPlay: true,
    autoCacheOnDownload: true,
    maxCacheSizeMB: 200, // Default binary standard match
  });

  const [cachedList, setCachedList] = useState<EnrichedCacheEntry[]>([]);
  const [totalSizeMB, setTotalSizeMB] = useState(0);
  const [quotaInfo, setQuotaInfo] = useState<{
    totalGB: string;
    freeGB: string;
  } | null>(null);

  const loadData = useCallback(async () => {
    // 1. Storage Estimate Calculations
    if (navigator.storage?.estimate) {
      const { usage = 0, quota = 0 } = await navigator.storage.estimate();
      const freeBytes = quota - usage;
      setQuotaInfo({
        totalGB: (quota / (1024 * 1024 * 1024)).toFixed(1),
        freeGB: (freeBytes / (1024 * 1024 * 1024)).toFixed(1),
      });
    }

    // 2. Hydrate Ledger Records from IndexedDB
    const idbRequest = indexedDB.open(DB_NAME);
    idbRequest.onsuccess = async () => {
      const db = idbRequest.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) return;

      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const index = store.index("by_timestamp");

      index.getAll().onsuccess = async (e) => {
        const entries = (e.target as IDBRequest).result as any[];
        const coreDb = await getDB();
        const enriched: EnrichedCacheEntry[] = [];
        let totalBytes = 0;

        for (const entry of entries) {
          totalBytes += entry.sizeBytes;
          let name = `Recording #${entry.recId}`;
          let speakers = "Unknown Speaker";

          if (coreDb) {
            try {
              const rec = await coreDb.get(STORE.RECORDINGS, entry.recId);
              if (rec) {
                name = rec.name || name;
                if (rec.speaker_ids) {
                  const speakerNames: string[] = [];
                  for (const sId of rec.speaker_ids) {
                    const speaker = await coreDb.get(STORE.SPEAKERS, sId);
                    if (speaker) speakerNames.push(speaker.name);
                  }
                  if (speakerNames.length > 0)
                    speakers = speakerNames.join(", ");
                }
              }
            } catch (_) {}
          }

          enriched.push({
            audioId: entry.audioId,
            recId: entry.recId,
            sizeBytes: entry.sizeBytes,
            lastAccessed: entry.lastAccessed,
            name,
            speakers,
          });
        }

        // Fresh descending sequence
        enriched.sort((a, b) => b.lastAccessed - a.lastAccessed);
        setCachedList(enriched);
        setTotalSizeMB(Math.round((totalBytes / (1024 * 1024)) * 10) / 10);
      };
    };
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = parseInt(e.target.value, 10);
    setSettingsState((prev) => ({ ...prev, maxCacheSizeMB: size }));
    toast.success(`Max cache size set to ${size} MB`);
    // Dynamic watermark logic would check this limit balance asynchronously next
  };

  const handleDelete = async (audioId: string, name: string) => {
    const cache = await caches.open(CACHE_NAME);
    const cacheDeleted = await cache.delete(audioId);

    if (cacheDeleted) {
      const request = indexedDB.open(DB_NAME);
      request.onsuccess = () => {
        const db = request.result;
        const tx = db.transaction(STORE_NAME, "readwrite");
        tx.objectStore(STORE_NAME).delete(audioId);
        tx.oncomplete = () => {
          toast.success(`Deleted cached audio for "${name}"`);
          loadData();
        };
      };
    } else {
      toast.error("Failed to clear file from Cache Storage");
    }
  };

  const percentUsed = Math.min(
    100,
    (totalSizeMB / settings.maxCacheSizeMB) * 100,
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
      {/* Column 1: Configuration & Estimates */}
      <div className="lg:col-span-1 p-4 border rounded-2xl bg-card border-border shadow-md flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="font-bold text-sm">Cache Config</h3>
          <span className="text-xxs font-bold tracking-wider uppercase text-muted-foreground">
            Offline Caching
          </span>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold">Max Cache Limit</span>
          <select
            value={settings.maxCacheSizeMB}
            onChange={handleSizeChange}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-hidden"
          >
            <option value="200">200 MB (Min Limit)</option>
            <option value="500">500 MB</option>
            <option value="1024">1024 MB (1 GB)</option>
            <option value="2048">2048 MB (2 GB)</option>
          </select>
        </div>

        {quotaInfo && (
          <div className="p-3 bg-muted/5 border border-border rounded-xl flex items-start gap-3 text-xs">
            <HardDrive className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-col gap-1">
              <span className="font-bold">System Disk Estimate</span>
              <span className="text-muted-foreground text-xxs leading-snug">
                Total Browser Quota: {quotaInfo.totalGB} GB <br />
                Free Space: {quotaInfo.freeGB} GB available.
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-1.5 pt-2">
          <div className="flex justify-between text-xxs font-bold uppercase text-muted-foreground">
            <span>Storage Used</span>
            <span>
              {totalSizeMB} MB / {settings.maxCacheSizeMB} MB
            </span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>
      </div>

      {/* Column 2: Cached Files List */}
      <div className="lg:col-span-2 p-4 border rounded-2xl bg-card border-border shadow-md flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-2">
          <h3 className="font-bold text-sm">Cached Audio Files</h3>
          <span className="text-xxs font-bold tracking-wider uppercase text-muted-foreground">
            {cachedList.length} Files
          </span>
        </div>

        {cachedList.length === 0 ? (
          <div className="py-16 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2">
            <span>No audio files cached yet.</span>
            <span className="text-xxs text-muted-foreground opacity-80">
              Listen to lectures online to save them here for offline access.
            </span>
          </div>
        ) : (
          <div
            className="overflow-y-auto flex flex-col gap-2"
            style={{ maxHeight: "400px" }}
          >
            {cachedList.map((entry) => (
              <div
                key={entry.audioId}
                className="p-3 border border-border bg-muted/5 rounded-xl flex items-center justify-between gap-3 hover:bg-primary/20 transition-colors"
              >
                <div className="flex-grow">
                  <p className="font-bold text-xs truncate leading-snug text-primary">
                    {entry.name}
                  </p>
                  <p className="text-xxs text-muted-foreground truncate mt-0.5">
                    {entry.speakers}
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xxs text-muted-foreground font-semibold">
                    {(entry.sizeBytes / (1024 * 1024)).toFixed(1)} MB
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(entry.audioId, entry.name)}
                    className="text-destructive hover:bg-destructive/10 p-2 rounded-md cursor-pointer transition-colors"
                    title={`Delete "${entry.name}" from cache`}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
