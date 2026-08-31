import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearSyncMetaCache, fetchSyncMeta } from "./meta-cache";

describe("workers/meta-cache suite", () => {
  beforeEach(() => {
    clearSyncMetaCache();
  });

  afterEach(() => {
    clearSyncMetaCache();
    vi.restoreAllMocks();
  });

  it("deduplicates simultaneous in-flight fetch calls", async () => {
    let callCount = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            categories: "2026-01-01T00:00:00Z",
            public_feature_flags: ["ga_flag"],
          }),
      } as any);
    });

    // Fire 3 simultaneous calls
    const [res1, res2, res3] = await Promise.all([
      fetchSyncMeta("https://dedupe.example.com"),
      fetchSyncMeta("https://dedupe.example.com"),
      fetchSyncMeta("https://dedupe.example.com"),
    ]);

    expect(callCount).toBe(1);
    expect(res1.serverMeta["categories"]).toBe("2026-01-01T00:00:00Z");
    expect(res2.publicFeatureFlags).toEqual(["ga_flag"]);
    expect(res3.serverMeta["categories"]).toBe("2026-01-01T00:00:00Z");
  });

  it("returns cached result within TTL without calling fetch again", async () => {
    let callCount = 0;
    vi.spyOn(globalThis, "fetch").mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ recordings: "2026-01-01T00:00:00Z" }),
      } as any);
    });

    const res1 = await fetchSyncMeta("https://ttl.example.com");
    expect(callCount).toBe(1);
    expect(res1.serverMeta["recordings"]).toBe("2026-01-01T00:00:00Z");

    // Second call within TTL window
    const res2 = await fetchSyncMeta("https://ttl.example.com");
    expect(callCount).toBe(1);
    expect(res2.serverMeta["recordings"]).toBe("2026-01-01T00:00:00Z");
  });
});
