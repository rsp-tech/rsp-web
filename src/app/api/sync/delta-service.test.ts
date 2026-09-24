import { describe, expect, it, vi } from "vitest";
import { STORE } from "@/constants";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
}));

vi.mock("./meta-service", () => ({
  getCachedSyncMeta: () =>
    Promise.resolve({
      categories: "2026-01-05T00:00:00Z",
      recordings: "2026-01-05T00:00:00Z",
      users: "2026-01-05T00:00:00Z",
    }),
}));

vi.mock("./baseline-cache", () => ({
  getCachedPublicTable: (t: string) => {
    if (t === STORE.CATEGORIES) {
      return Promise.resolve([
        {
          id: 1,
          name: "Cat 1",
          url_path: "cat_1",
          updated_at: "2026-01-01T00:00:00Z",
        },
        {
          id: 2,
          name: "Cat 2",
          url_path: "cat_2",
          updated_at: "2026-01-03T00:00:00Z",
        },
      ]);
    }
    if (t === STORE.REDIRECTS) {
      return Promise.resolve([
        {
          id: "old_path",
          to_path: "cat_1",
          updated_at: "2026-01-01T00:00:00Z",
        },
      ]);
    }
    return Promise.resolve([]);
  },
  getCachedRoleExtraTable: () => Promise.resolve([]),
  getCachedUserTable: (t: string) => {
    if (t === STORE.USERS) {
      return Promise.resolve([
        {
          id: "u123",
          email: "test@example.com",
          updated_at: "2026-01-02T00:00:00Z",
        },
      ]);
    }
    return Promise.resolve([]);
  },
}));

vi.mock("./live-diff-fetcher", () => ({
  getCachedLiveDiff: () => Promise.resolve([]),
}));

describe.concurrent("delta-service suite", () => {
  it.concurrent("computePublicSyncDelta calculates changed tables and deltas", async () => {
    const { computePublicSyncDelta } = await import("./delta-service");
    const res = await computePublicSyncDelta({
      categories: "2026-01-02T00:00:00Z",
    });

    expect(res.changed).toBe(true);
    expect(res.deltas[STORE.CATEGORIES]).toBeDefined();
  });

  it.concurrent("computeRoleSyncDelta returns unchanged when watermarks match", async () => {
    const { computeRoleSyncDelta } = await import("./delta-service");
    const res = await computeRoleSyncDelta(
      {
        categories: "2026-01-05T00:00:00Z",
        recordings: "2026-01-05T00:00:00Z",
      },
      1,
    );

    expect(res.changed).toBe(false);
  });

  it.concurrent("computeUserSyncDelta computes deltas for authenticated user", async () => {
    const { computeUserSyncDelta } = await import("./delta-service");
    const res = await computeUserSyncDelta(
      { users: "2026-01-01T00:00:00Z" },
      "u123",
    );

    expect(res.changed).toBe(true);
    expect(res.deltas[STORE.USERS]).toBeDefined();
  });

  it.concurrent("getCachedPublicUrlPaths returns list of category url_paths and redirect ids", async () => {
    const { getCachedPublicUrlPaths } = await import("./delta-service");
    const paths = await getCachedPublicUrlPaths();
    expect(paths).toContain("cat_1");
    expect(paths).toContain("cat_2");
    expect(paths).toContain("old_path");
  });
});
