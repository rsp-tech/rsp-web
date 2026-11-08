import { describe, expect, it, vi } from "vitest";
import { META_KEY, STORE } from "@/constants";
import { createMockDb } from "@/test-utils/mock-idb";

const mockLoadStaticZipSeedsForRole = vi.fn().mockResolvedValue(true);

vi.mock("./cleanup-helpers", () => ({
  performRoleCleanup: () => Promise.resolve({ clearedRole: false }),
}));

vi.mock("./utils", async (importOriginal) => ({
  ...(await importOriginal()),
  isDatabaseStale: () => Promise.resolve(false),
  loadStaticZipSeedsForRole: (...args: any[]) =>
    mockLoadStaticZipSeedsForRole(...args),
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
        children: [],
      },
      changedTables: ["recordings"],
      rebuildSearchIndex: false,
    }),
}));

describe.concurrent("workers/role-helpers suite", () => {
  it.concurrent("syncRoleData loads static zip seed when SYNC_ROLE is missing", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ recordings: "2026-01-02" }),
    });

    const mockDb = createMockDb();

    const { syncRoleData } = await import("./sync-role-helpers");
    await syncRoleData(mockDb as any, "https://localhost", {
      roleId: 1,
      userId: "u1",
      accessToken: "token123",
    });

    expect(mockLoadStaticZipSeedsForRole).toHaveBeenCalledWith(
      mockDb,
      "https://localhost",
      1,
      "token123",
    );
    expect(await mockDb.get(STORE.ROLE_META, META_KEY.SYNC_ROLE)).toBe(1);
  });

  it.concurrent("syncRoleData handles role delta synchronization", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ recordings: "2026-01-02" }),
    });

    const mockDb = createMockDb({
      [`${STORE.ROLE_SYNC_META}:recordings`]: { updated_at: "2026-01-01" },
      [`${STORE.ROLE_META}:${META_KEY.SYNC_ROLE}`]: 1,
    });

    const { syncRoleData } = await import("./sync-role-helpers");
    const res = await syncRoleData(mockDb as any, "https://localhost", {
      roleId: 1,
      userId: "u1",
      accessToken: "token123",
    });
    expect(res.changedTables).toContain("recordings");
  });
});
