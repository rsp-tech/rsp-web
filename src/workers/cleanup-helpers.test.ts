import { describe, expect, it } from "vitest";
import { META_KEY, STORE } from "@/constants";
import { createMockDb } from "@/test-utils/mock-idb";

describe.concurrent("workers/cleanup-helpers suite", () => {
  it.concurrent("performUserCleanup clears user data on user id mismatch", async () => {
    const mockDb = createMockDb({
      [`${STORE.ROLE_META}:${META_KEY.CLEANUP_USER_ID}`]: "user_1",
    });

    const { performUserCleanup } = await import("./cleanup-helpers");
    const res = await performUserCleanup(mockDb as any, "user_2");
    expect(res.clearedUser).toBe(true);
  });

  it.concurrent("performRoleCleanup clears role data on role mismatch", async () => {
    const mockDb = createMockDb({
      [`${STORE.ROLE_META}:${META_KEY.CLEANUP_ROLE}`]: 1,
    });

    const { performRoleCleanup } = await import("./cleanup-helpers");
    const res = await performRoleCleanup(mockDb as any, 2);
    expect(res.clearedRole).toBe(true);
  });
});
