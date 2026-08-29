import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/sync-worker-client", () => ({
  dispatchSyncJob: () =>
    Promise.resolve({
      clearedUser: true,
      clearedRole: true,
    }),
}));

vi.mock("./sync-helpers", () => ({
  handleUserCleanup: vi.fn(),
  handleRoleCleanup: vi.fn(),
}));

import { handleRoleCleanup, handleUserCleanup } from "./sync-helpers";
import { runCleanup, useCleanup } from "./use-cleanup";

describe.concurrent("use-cleanup suite", () => {
  it.concurrent("runCleanup dispatches job and invokes cleanup handlers", async () => {
    const queryClient: any = {};
    await runCleanup({ queryClient, roleId: 2, userId: "u1" });
    expect(handleUserCleanup).toHaveBeenCalledWith(queryClient);
    expect(handleRoleCleanup).toHaveBeenCalledWith(queryClient);
  });
});

