import { describe, expect, it } from "vitest";

describe.concurrent("workers/cleanup-helpers suite", () => {
  it.concurrent("performUserCleanup clears user data on user id mismatch", async () => {
    const mockDb: any = {
      getKey: () => Promise.resolve("user_1"),
      get: () => Promise.resolve("user_1"),
      put: () => Promise.resolve(),
      clear: () => Promise.resolve(),
      transaction: () => ({
        store: {
          delete: () => Promise.resolve(),
        },
        done: Promise.resolve(),
      }),
    };

    const { performUserCleanup } = await import("./cleanup-helpers");
    const res = await performUserCleanup(mockDb, "user_2");
    expect(res.clearedUser).toBe(true);
  });

  it.concurrent("performRoleCleanup clears role data on role mismatch", async () => {
    const mockDb: any = {
      getKey: () => Promise.resolve(1),
      get: () => Promise.resolve(1),
      put: () => Promise.resolve(),
      clear: () => Promise.resolve(),
      transaction: () => ({
        store: {
          openCursor: () => Promise.resolve(null),
        },
        done: Promise.resolve(),
      }),
    };

    const { performRoleCleanup } = await import("./cleanup-helpers");
    const res = await performRoleCleanup(mockDb, 2);
    expect(res.clearedRole).toBe(true);
  });
});
