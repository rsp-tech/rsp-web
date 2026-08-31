import { describe, expect, it, vi } from "vitest";
import { META_KEY, STORE } from "@/constants";
import { createMockDb } from "@/test-utils/mock-idb";

vi.mock("./cleanup-helpers", () => ({
  performUserCleanup: () => Promise.resolve({ clearedUser: false }),
}));

const mockFetchUserSyncDeltas = vi.fn().mockImplementation(() =>
  Promise.resolve({
    deltas: { user_queries: [{ id: "q1", subject: "Help" }] },
    sync_meta: { user_queries: "2026-01-02" },
  }),
);

vi.mock("./utils", async (importOriginal) => ({
  ...(await importOriginal()),
  loadUserSeeds: () => Promise.resolve(),
  fetchUserSyncDeltas: (...args: any[]) => mockFetchUserSyncDeltas(...args),
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
  it.concurrent("syncUserData handles user delta synchronization when dirty", async () => {
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user_queries: "2026-01-02" }),
    });

    const mockDb = createMockDb({
      [`${STORE.SYNC_META}:${STORE.USERS}`]: { updated_at: "2026-01-01" },
      [`${STORE.SYNC_META}:user_queries`]: { updated_at: "2026-01-01" },
      [`${STORE.ROLE_META}:${META_KEY.USER_FEATURES}`]: JSON.stringify([]),
    });

    const { syncUserData } = await import("./sync-user-helpers");
    const res = await syncUserData(
      mockDb as any,
      "https://dirty-user.localhost",
      {
        userId: "u1",
        accessToken: "token123",
      },
    );
    expect(res.changedTables).toContain("user_queries");
  });

  it.concurrent("syncUserData skips delta post API when tables are clean", async () => {
    const originalFetch = globalThis.fetch;
    (globalThis as any).fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/api/sync/meta")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ user_queries: "2026-01-01" }),
        });
      }
      return Promise.reject(new Error("Should not fetch deltas"));
    });

    const mockDb = createMockDb({
      [`${STORE.SYNC_META}:${STORE.USERS}`]: { updated_at: "2026-01-01" },
      [`${STORE.SYNC_META}:user_queries`]: { updated_at: "2026-01-01" },
      [`${STORE.ROLE_META}:${META_KEY.USER_FEATURES}`]: JSON.stringify([]),
    });

    const { syncUserData } = await import("./sync-user-helpers");
    const res = await syncUserData(
      mockDb as any,
      "https://clean-user.localhost",
      {
        userId: "u1",
        accessToken: "token123",
      },
    );
    expect(res).toBeDefined();

    globalThis.fetch = originalFetch;
  });
});
