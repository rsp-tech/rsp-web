import { describe, expect, it, vi } from "vitest";

vi.mock("./cleanup-helpers", () => ({
  performRoleCleanup: () => Promise.resolve({ clearedRole: false }),
}));

vi.mock("./utils", () => ({
  isDatabaseStale: () => Promise.resolve(false),
  loadStaticZipSeedsForRole: () => Promise.resolve(false),
  fetchRoleSyncDeltas: () =>
    Promise.resolve({
      deltas: { recordings: [{ id: 1, name: "Role Recording" }] },
      sync_meta: { recordings: "2026-01-02" },
    }),
  applyDeltas: () => Promise.resolve(["recordings"]),
  toSyncResult: () =>
    Promise.resolve({
      clearedUser: false,
      clearedRole: false,
      changedCategoryPaths: [],
      changedIds: { recordings: [1], categories: [], materials: [] },
      newAdditions: {
        recordings: [],
        materials: [],
        categories: [],
        replies: [],
        requests: [],
      },
      changedTables: ["recordings"],
      rebuildSearchIndex: false,
    }),
}));

describe.concurrent("workers/role-helpers suite", () => {
  it.concurrent("syncRoleData handles role delta synchronization", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ recordings: "2026-01-02" }),
    });

    const mockDb: any = {
      getAll: () =>
        Promise.resolve([{ id: "recordings", updated_at: "2026-01-01" }]),
      get: () => Promise.resolve(1),
      put: () => Promise.resolve(),
    };

    const { syncRoleData } = await import("./sync-role-helpers");
    const res = await syncRoleData(mockDb, "https://localhost", {
      roleId: 1,
      userId: "u1",
      accessToken: "token123",
    });
    expect(res.changedTables).toContain("recordings");
  });
});
