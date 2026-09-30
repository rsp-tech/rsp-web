import { describe, expect, it, vi } from "vitest";
import { STORE } from "@/constants";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("./utils", () => ({
  fetchBackupAsset: () =>
    Promise.resolve({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    }),
}));

vi.mock("fflate", () => ({
  unzipSync: () => ({}),
}));

vi.mock("@/lib/sync-utils", () => ({
  toCSVRows: () => [
    ["id", "name", "updated_at"],
    ["1", "Cat 1", "2026-01-01T00:00:00Z"],
  ],
  parseCSVTable: () => [
    { id: 1, name: "Cat 1", updated_at: "2026-01-01T00:00:00Z" },
  ],
  findFirstIndexAfter: () => 0,
}));

describe.concurrent("api/sync/baseline-cache suite", () => {
  it.concurrent("getCachedPublicTable fetches public baseline rows", async () => {
    const { getCachedPublicTable } = await import("./baseline-cache");
    const rows = await getCachedPublicTable(STORE.CATEGORIES);
    expect(rows.length).toBeGreaterThan(0);
    expect(rows[0]?.["id"]).toBe(1);
  });
});
