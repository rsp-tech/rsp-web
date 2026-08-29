import { describe, expect, it, vi } from "vitest";
import { STORE } from "@/constants";

vi.mock("./utils", () => ({
  isDatabaseStale: () => Promise.resolve(false),
  loadStaticZipSeeds: () => Promise.resolve(false),
  fetchPublicSyncDeltas: () =>
    Promise.resolve({
      deltas: { categories: [{ id: 1, name: "Cat 1" }] },
      sync_meta: { categories: "2026-01-02" },
    }),
  applyDeltas: () => Promise.resolve(["categories"]),
  toSyncResult: () =>
    Promise.resolve({
      clearedUser: false,
      clearedRole: false,
      changedCategoryPaths: ["cat_1"],
      changedIds: { recordings: [], categories: [1], materials: [] },
      newAdditions: {
        recordings: [],
        materials: [],
        categories: [],
        replies: [],
        requests: [],
      },
      changedTables: ["categories"],
      rebuildSearchIndex: false,
    }),
}));

describe.concurrent("workers/public-helpers suite", () => {
  it.concurrent("syncPublicData fetches metadata and performs delta sync", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ categories: "2026-01-02" }),
    });

    const mockDb: any = {
      getAll: () => Promise.resolve([{ id: "categories", updated_at: "2026-01-01" }]),
    };

    const { syncPublicData } = await import("./sync-public-helpers");
    const res = await syncPublicData(mockDb, "https://localhost");
    expect(res.changedTables).toContain("categories");
  });
});



