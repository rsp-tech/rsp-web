import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/sync-worker-client", () => ({
  dispatchSyncJob: () => Promise.resolve({ changedTables: ["user_queries"] }),
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
import { runUserSync, useUserSync } from "./use-user-sync";

describe.concurrent("use-user-sync hook suite", () => {
  it.concurrent("runUserSync dispatches user sync job and handles success", async () => {
    const queryClient: any = {};
    const res = await runUserSync({
      queryClient,
      userId: "u1",
      accessToken: "tok_123",
    });
    expect(res).toBe(1);
    expect(handleSyncSuccess).toHaveBeenCalled();
  });
});

