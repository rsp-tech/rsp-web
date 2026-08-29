import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/sync-worker-client", () => ({
  dispatchSyncJob: () => Promise.resolve({ changedTables: ["recordings"] }),
}));

vi.mock("./sync-helpers", () => ({
  handleSyncSuccess: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    loading: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
  },
}));

import { handleSyncSuccess } from "./sync-helpers";
import { runRoleSync, useRoleSync } from "./use-role-sync";

describe.concurrent("use-role-sync hook suite", () => {
  it.concurrent("runRoleSync dispatches role sync job and handles success", async () => {
    const queryClient: any = {};
    const res = await runRoleSync({
      queryClient,
      roleId: 1,
      userId: "u1",
      accessToken: "tok_123",
    });
    expect(res).toBe(1);
    expect(handleSyncSuccess).toHaveBeenCalled();
  });
});

