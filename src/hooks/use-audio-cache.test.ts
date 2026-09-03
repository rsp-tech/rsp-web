import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/idb", () => ({
  getDB: () =>
    Promise.resolve({
      getAll: () =>
        Promise.resolve([{ id: "aud_1", recId: 10, size: 5 * 1024 * 1024 }]),
      get: () => Promise.resolve({ id: 10, name: "Lecture 1" }),
      delete: vi.fn(),
      clear: vi.fn(),
    }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryFn }: any) => ({
    data: queryFn ? queryFn() : undefined,
    isLoading: false,
  }),
  useMutation: ({ mutationFn, onSuccess }: any) => ({
    mutateAsync: async (args: any) => {
      const res = await mutationFn(args);
      onSuccess?.();
      return res;
    },
  }),
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

import {
  DEFAULT_SETTINGS,
  getAudioCacheSettings,
  useAudioCacheList,
  useClearAllAudioCache,
  useDeleteAudioCache,
} from "./use-audio-cache";

describe.concurrent("use-audio-cache hook suite", () => {
  it.concurrent("getAudioCacheSettings retrieves and parses settings safely", () => {
    expect(getAudioCacheSettings()).toEqual(DEFAULT_SETTINGS);

    localStorage.setItem(
      "rsp-audio-settings",
      JSON.stringify({ maxCacheSizeMB: 300 }),
    );
    expect(getAudioCacheSettings()).toEqual({
      maxCacheSizeMB: 300,
      enableMaterialsCache: true,
    });

    localStorage.setItem("rsp-audio-settings", "corrupt");
    expect(getAudioCacheSettings()).toEqual(DEFAULT_SETTINGS);
    localStorage.removeItem("rsp-audio-settings");
  });

  it.concurrent("useAudioCacheList retrieves combined ledger and recording data", async () => {
    const res = useAudioCacheList();
    const list = await res.data;
    expect(list?.length).toBe(1);
    expect(list?.[0]?.name).toBe("Lecture 1");
  });

  it.concurrent("useDeleteAudioCache deletes item from cache and idb", async () => {
    const deletedKeys: string[] = [];
    (globalThis as any).caches = {
      open: () =>
        Promise.resolve({
          delete: (k: string) => {
            deletedKeys.push(k);
            return Promise.resolve(true);
          },
        }),
      delete: vi.fn(),
    };

    const mut = useDeleteAudioCache();
    await mut.mutateAsync("aud_1");
    expect(deletedKeys).toContain("aud_1");
  });

  it.concurrent("useClearAllAudioCache purges caches and idb ledger", async () => {
    const deleteCache = vi.fn();
    (globalThis as any).caches = {
      delete: deleteCache,
    };

    const mut = useClearAllAudioCache();
    await mut.mutateAsync();
    expect(deleteCache).toHaveBeenCalled();
  });
});
