import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/sync-worker-client", () => ({
  dispatchSyncJob: () => Promise.resolve({ changedTables: ["categories"] }),
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
import { runPublicSync } from "./use-public-sync";

describe.concurrent("use-public-sync hook suite", () => {
  it.concurrent("runPublicSync dispatches public sync job and processes result", async () => {
    const queryClient: any = {};
    const res = await runPublicSync({ queryClient });
    expect(res).toBe(1);
    expect(handleSyncSuccess).toHaveBeenCalled();
  });
});
