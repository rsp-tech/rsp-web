import { describe, expect, it, vi } from "vitest";
import { WORKER_MSG } from "@/constants";

vi.mock("@/lib/idb", () => ({
  getDB: () => Promise.resolve({}),
}));

vi.mock("./sync-public-helpers", () => ({
  syncPublicData: () =>
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
      changedTables: [],
      rebuildSearchIndex: false,
    }),
}));

vi.mock("./cleanup-helpers", () => ({
  performRoleCleanup: () => Promise.resolve({ clearedRole: true }),
  performUserCleanup: () => Promise.resolve({ clearedUser: true }),
}));

vi.mock("./utils", () => ({
  syncCacheAndIDB: () => Promise.resolve(),
}));

describe.concurrent("workers/sync suite", () => {
  it.concurrent("handles START_PUBLIC_SYNC and START_CLEANUP messages", async () => {
    const posted: any[] = [];
    const mockPost = (m: any) => posted.push(m);
    (globalThis as any).postMessage = mockPost;
    (globalThis as any).self = {
      onmessage: null,
      postMessage: mockPost,
      location: { origin: "https://localhost" },
    };

    await import("./sync");

    if (typeof self.onmessage === "function") {
      await self.onmessage({
        data: { type: WORKER_MSG.START_PUBLIC_SYNC, jobId: "job_1" },
      } as any);

      expect(posted.some((m) => m.type === WORKER_MSG.SUCCESS)).toBe(true);

      await self.onmessage({
        data: {
          type: WORKER_MSG.START_CLEANUP,
          roleId: 2,
          userId: "u1",
          jobId: "job_2",
        },
      } as any);

      expect(
        posted.some((m) => m.type === WORKER_MSG.SUCCESS && m.clearedRole),
      ).toBe(true);
    }
  });
});

