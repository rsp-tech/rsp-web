import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/sync-worker-client", () => ({
  dispatchSyncJob: () => Promise.resolve({ changedTables: ["recordings"] }),
}));

vi.mock("./sync-helpers", async (importOriginal) => {
  const actual: any = await importOriginal();
  return {
    ...actual,
    handleSyncSuccess: vi.fn(),
  };
});

vi.mock("sonner", () => ({
  toast: {
    loading: vi.fn(),
    error: vi.fn(),
    success: vi.fn(),
    dismiss: vi.fn(),
  },
}));

import { runRoleSync } from "./use-role-sync";

describe.concurrent("use-role-sync hook suite", () => {
  it.concurrent("runRoleSync dispatches role sync job and handles success", async () => {
    const queryClient: any = {
      invalidateQueries: vi.fn(),
    };
    const res = await runRoleSync({
      queryClient,
      roleId: 1,
      userId: "u1",
      accessToken: "tok_123",
    });
    expect(res).toBe(1);
  });
});
