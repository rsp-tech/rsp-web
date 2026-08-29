import { describe, expect, it, vi } from "vitest";

const stored: any[] = [];
const storedEntries = [
  { id: "old_track", recId: 1, size: 100 * 1024 * 1024, accessedAt: 100 },
  { id: "new_track", recId: 2, size: 150 * 1024 * 1024, accessedAt: 200 },
];

const mockDb: any = {
  getAll: () => Promise.resolve([...storedEntries]),
  transaction: () => ({
    store: {
      put: (entry: any) => {
        stored.push(entry);
        return Promise.resolve();
      },
      delete: (id: string) => {
        const idx = storedEntries.findIndex((e) => e.id === id);
        if (idx !== -1) storedEntries.splice(idx, 1);
        return Promise.resolve();
      },
    },
    done: Promise.resolve(),
  }),
};

vi.mock("./idb", () => ({
  getDB: () => Promise.resolve(mockDb),
}));

describe("audio-idb-ledger suite", () => {
  it("touchTrackMeta puts ledger entry into database", async () => {
    const { touchTrackMeta } = await import("./audio-idb-ledger");
    await touchTrackMeta("audio_1", 101, 1024 * 1024);
    expect(stored.length).toBeGreaterThan(0);
    expect(stored[0]?.id).toBe("audio_1");
  });

  it("enforceLRUWatermark deletes oldest cached audio files when over limit", async () => {
    const deletedCacheKeys: string[] = [];
    const mockCache = {
      delete: (k: string) => {
        deletedCacheKeys.push(k);
        return Promise.resolve(true);
      },
    };
    (globalThis as any).caches = {
      open: () => Promise.resolve(mockCache),
    };

    const { enforceLRUWatermark } = await import("./audio-idb-ledger");
    await enforceLRUWatermark(200);
    expect(deletedCacheKeys).toContain("old_track");
  });
});
