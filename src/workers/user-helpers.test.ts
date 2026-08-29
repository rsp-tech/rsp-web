import { describe, expect, it, vi } from "vitest";

vi.mock("./cleanup-helpers", () => ({
  performUserCleanup: () => Promise.resolve({ clearedUser: false }),
}));

vi.mock("./utils", () => ({
  loadUserSeeds: () => Promise.resolve(),
  fetchUserSyncDeltas: () =>
    Promise.resolve({
      deltas: { user_queries: [{ id: "q1", subject: "Help" }] },
      sync_meta: { user_queries: "2026-01-02" },
    }),
  applyDeltas: () => Promise.resolve(["user_queries"]),
  toSyncResult: () =>
    Promise.resolve({
      clearedUser: false,
      clearedRole: false,
      changedCategoryPaths: [],
      changedIds: { recordings: [], categories: [], materials: [] },
      newAdditions: {
        recordings: [],
        materials: [],
        categories: [],
        replies: [],
        requests: [],
      },
      changedTables: ["user_queries"],
      rebuildSearchIndex: false,
    }),
}));

describe.concurrent("workers/user-helpers suite", () => {
  it.concurrent("syncUserData handles user delta synchronization", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user_queries: "2026-01-02" }),
    });

    const mockDb: any = {
      getAll: () =>
        Promise.resolve([{ id: "user_queries", updated_at: "2026-01-01" }]),
      get: () => Promise.resolve({ updated_at: "2026-01-01" }),
      put: () => Promise.resolve(),
    };

    const { syncUserData } = await import("./sync-user-helpers");
    const res = await syncUserData(mockDb, "https://localhost", {
      userId: "u1",
      accessToken: "token123",
    });
    expect(res.changedTables).toContain("user_queries");
  });
});
