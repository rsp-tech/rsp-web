import { describe, expect, it, vi } from "vitest";
import { STORE } from "@/constants";

describe.concurrent("workers/utils suite", () => {
  it.concurrent("toSyncResult correctly constructs SyncResult object", async () => {
    const { toSyncResult } = await import("./utils");
    const mockDb: any = {
      get: (store: string, id: number) => {
        if (store === STORE.CATEGORIES) return Promise.resolve({ url_path: `cat_${id}` });
        if (store === STORE.RECORDINGS) return Promise.resolve({ category_id: 99 });
        return Promise.resolve(null);
      },
    };

    const result = await toSyncResult(
      mockDb,
      {
        changedCategories: { 1: "c1" },
        bubbledChangeCategoryIds: new Set([1]),
        changedRecordings: {},
        bubbledChangeRecordingIds: new Set(),
      },
      { categories: [1], recordings: [], materials: [] },
      [STORE.CATEGORIES],
      { categories: [], recordings: [], materials: [], replies: [], requests: [] },
      false,
      false,
    );

    expect(result.changedTables).toContain(STORE.CATEGORIES);
    expect(result.changedCategoryPaths).toContain("c1");
  });

  it.concurrent("syncCacheAndIDB scans cache and syncs ledger", async () => {
    const mockCache = {
      keys: () => Promise.resolve([new Request("https://cdn.example.com/audio/track123")]),
      match: () =>
        Promise.resolve({
          headers: new Headers({ "content-length": "2048" }),
        }),
    };

    (globalThis as any).self = {
      caches: {
        open: () => Promise.resolve(mockCache),
      },
    };

    const putEntries: any[] = [];
    const mockDb: any = {
      get: () => Promise.resolve(null),
      transaction: () => ({
        store: {
          openCursor: () =>
            Promise.resolve({
              value: { id: 10, audio_id: "track123" },
              continue: () => Promise.resolve(null),
            }),
        },
      }),
      put: (store: string, entry: any) => {
        putEntries.push(entry);
        return Promise.resolve();
      },
    };

    const { syncCacheAndIDB } = await import("./utils");
    await syncCacheAndIDB(mockDb);
    expect(putEntries.length).toBe(1);
    expect(putEntries[0].id).toBe("track123");
    expect(putEntries[0].size).toBe(2048);
  });

  it.concurrent("isDatabaseStale determines whether local IndexedDB is outdated", async () => {
    const { isDatabaseStale } = await import("./utils");
    const mockDb: any = {
      get: vi.fn().mockImplementation((store, id) => {
        if (id === STORE.RECORDINGS) return Promise.resolve({ updated_at: "2026-01-01T00:00:00Z" });
        return Promise.resolve(null);
      }),
    };

    // Stale: missing server watermark
    expect(await isDatabaseStale(mockDb, {})).toBe(true);

    // Up to date: exact match
    expect(
      await isDatabaseStale(mockDb, { [STORE.RECORDINGS]: "2026-01-01T00:00:00Z" }),
    ).toBe(false);
  });

  it.concurrent("applyDeltas writes modified rows and updates meta store watermarks", async () => {
    const { applyDeltas } = await import("./utils");
    const putRecordings = vi.fn();
    const putMeta = vi.fn();
    const mockDb: any = {
      transaction: vi.fn().mockImplementation((store) => {
        if (store === STORE.RECORDINGS) {
          return {
            store: { put: putRecordings },
            done: Promise.resolve(),
          };
        }
        return {
          store: { put: putMeta },
          done: Promise.resolve(),
        };
      }),
      get: vi.fn().mockResolvedValue(null),
    };

    const changedTables = await applyDeltas(
      mockDb,
      {
        [STORE.RECORDINGS]: [{ id: 1, title: "BG 1.1", created_at: "2026-01-01" }],
      },
      { [STORE.RECORDINGS]: "2026-01-02T00:00:00Z" },
      {},
      { recordings: [], categories: [], materials: [] },
      {
        changedCategories: {},
        bubbledChangeCategoryIds: new Set(),
        changedRecordings: {},
        bubbledChangeRecordingIds: new Set(),
      },
      { recordings: [], materials: [], categories: [], replies: [], requests: [] },
    );

    expect(changedTables).toContain(STORE.RECORDINGS);
    expect(putMeta).toHaveBeenCalled();
  });
});



