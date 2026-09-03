"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import {
  AUDIO_CACHE_NAME,
  MATERIALS_CACHE_NAME,
  QUERY_KEY,
  STORE,
} from "@/constants";
import { getDB } from "@/lib/idb";
import type {
  AudioCacheLedgerEntry,
  EnrichedRecording,
  Recording,
} from "@/types";

export interface CachedRecording extends EnrichedRecording {
  audioId: string;
  size: number;
  accessedAt: number;
}

export interface AudioCacheSettings {
  maxCacheSizeMB: number;
  enableMaterialsCache?: boolean;
}

export const DEFAULT_SETTINGS: AudioCacheSettings = {
  maxCacheSizeMB: 200,
  enableMaterialsCache: true,
};

export const getAudioCacheSettings = (): AudioCacheSettings => {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  try {
    const saved = localStorage.getItem("rsp-audio-settings");
    return saved
      ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) }
      : DEFAULT_SETTINGS;
  } catch (e) {
    console.error("Failed to read audio cache settings:", e);
    return DEFAULT_SETTINGS;
  }
};

const loadAudioCacheList = async (): Promise<
  (Recording & AudioCacheLedgerEntry)[]
> => {
  const db = await getDB();
  const entries = await db?.getAll(STORE.CACHE_LEDGER);

  return await Promise.all(
    entries?.map(async (entry) => {
      const rec = await db?.get(STORE.RECORDINGS, entry.recId);
      return {
        ...entry,
        ...rec,
      };
    }) ?? [],
  );
};

export const useAudioCacheList = () => {
  return useQuery({
    queryKey: [QUERY_KEY.AUDIO_CACHE_LIST],
    queryFn: loadAudioCacheList,
  });
};

export const useAudioCacheSettings = () => {
  const [settings, setSettingsState] =
    useState<AudioCacheSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    setSettingsState(getAudioCacheSettings());
  }, []);

  const updateSettings = useCallback(
    (newSettings: Partial<AudioCacheSettings>) => {
      setSettingsState((prev) => {
        const updated = { ...prev, ...newSettings };
        if (typeof window !== "undefined") {
          localStorage.setItem("rsp-audio-settings", JSON.stringify(updated));
        }
        return updated;
      });
    },
    [],
  );

  return { settings, updateSettings };
};

export const useAudioCacheStats = () => {
  const { data: cacheList, isLoading: isListLoading } = useAudioCacheList();
  const [stats, setStats] = useState<{
    totalSizeMB: number;
    quotaMB: number;
    freeMB: number;
  }>({ totalSizeMB: 0, quotaMB: 0, freeMB: 0 });
  const [isLoadingStats, setIsLoadingStats] = useState(true);

  const loadStats = useCallback(async () => {
    let quota = 0;
    let usage = 0;
    if (typeof window !== "undefined" && navigator.storage?.estimate) {
      try {
        const estimate = await navigator.storage.estimate();
        quota = estimate.quota || 0;
        usage = estimate.usage || 0;
      } catch (e) {
        console.error("Failed to estimate storage quota:", e);
      }
    }
    const free = Math.max(0, quota - usage);

    const totalBytes =
      cacheList?.reduce((acc, item) => acc + item.size, 0) ?? 0;

    setStats({
      totalSizeMB: Math.round((totalBytes / (1024 * 1024)) * 10) / 10,
      quotaMB: Math.round(quota / (1024 * 1024)),
      freeMB: Math.round(free / (1024 * 1024)),
    });
    setIsLoadingStats(false);
  }, [cacheList]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    ...stats,
    isLoading: isListLoading || isLoadingStats,
    refetchStats: loadStats,
  };
};

export const useDeleteAudioCache = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (audioId: string) => {
      if (typeof window !== "undefined" && "caches" in window) {
        const cache = await caches.open(AUDIO_CACHE_NAME);
        await cache.delete(audioId);
      }

      const db = await getDB();
      if (db) {
        await db.delete(STORE.CACHE_LEDGER, audioId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY.AUDIO_CACHE_LIST] });
    },
  });
};

export const useClearAllAudioCache = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (typeof window !== "undefined" && "caches" in window) {
        await caches.delete(AUDIO_CACHE_NAME);
      }
      const db = await getDB();
      if (db) {
        await db.clear(STORE.CACHE_LEDGER);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY.AUDIO_CACHE_LIST] });
    },
  });
};

export interface CachedMaterialItem {
  uri: string;
  name: string;
  type?: string | null;
  size: number;
}

const loadMaterialsCacheList = async (): Promise<CachedMaterialItem[]> => {
  if (typeof window === "undefined" || !("caches" in window)) return [];
  try {
    const cache = await caches.open(MATERIALS_CACHE_NAME);
    const requests = await cache.keys();
    const db = await getDB();
    const allMaterials = (await db?.getAll(STORE.MATERIALS)) ?? [];
    const matMap = new Map<string, (typeof allMaterials)[0]>();
    for (const m of allMaterials) {
      if (m.uri) matMap.set(m.uri, m);
    }

    const items: CachedMaterialItem[] = [];
    for (const req of requests) {
      const url = req.url;
      let matchedUri = url;
      let matchedMat = matMap.get(url);
      if (!matchedMat) {
        for (const [uri, m] of matMap.entries()) {
          if (url.includes(uri) || uri.includes(url)) {
            matchedUri = uri;
            matchedMat = m;
            break;
          }
        }
      }

      const response = await cache.match(req);
      let size = matchedMat?.size ?? 0;
      if (!size && response) {
        const blob = await response.clone().blob();
        size = blob.size;
      }

      items.push({
        uri: matchedUri,
        name: matchedMat?.name ?? url.split("/").pop() ?? "Study Material",
        type: matchedMat?.type ?? null,
        size,
      });
    }
    return items;
  } catch (err) {
    console.error("Failed to load materials cache list:", err);
    return [];
  }
};

export const useMaterialsCacheList = () => {
  return useQuery({
    queryKey: [QUERY_KEY.MATERIALS_CACHE_LIST],
    queryFn: loadMaterialsCacheList,
  });
};

export const useDeleteMaterialCache = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (uri: string) => {
      if (typeof window !== "undefined" && "caches" in window) {
        const cache = await caches.open(MATERIALS_CACHE_NAME);
        const requests = await cache.keys();
        for (const req of requests) {
          if (req.url === uri || req.url.includes(uri)) {
            await cache.delete(req);
          }
        }
        await cache.delete(uri);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.MATERIALS_CACHE_LIST],
      });
    },
  });
};

export const useClearAllMaterialsCache = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (typeof window !== "undefined" && "caches" in window) {
        await caches.delete(MATERIALS_CACHE_NAME);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.MATERIALS_CACHE_LIST],
      });
    },
  });
};
