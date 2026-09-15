import { describe, expect, it, vi } from "vitest";
import {
  QUERY_KEY,
  ROLE_SYNCED_TABLES,
  STORE,
  USER_SPECIFIC_TABLES,
} from "@/constants";
import {
  handleCategoryPathInvalidations,
  handleRoleCleanup,
  handleSyncSuccess,
  handleTableInvalidations,
  handleUserCleanup,
} from "./sync-helpers";

vi.mock("@/hooks/use-notifications", () => ({
  clearNotificationStorage: vi.fn(),
  addSyncNotifications: vi.fn(),
}));

vi.mock("@/hooks/use-search", () => ({
  terminateSearchWorker: vi.fn(),
  rebuildSearchIndex: vi.fn(),
  notifySearchWorker: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe.concurrent("sync-helpers suite", () => {
  it.concurrent("handleUserCleanup and handleRoleCleanup perform proper invalidations", () => {
    const invalidateQueries = vi.fn();
    const queryClient: any = { invalidateQueries };

    handleUserCleanup(queryClient);
    for (const table of USER_SPECIFIC_TABLES) {
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: [table],
      });
    }
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.FEATURE_CONFIG],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.SYNC_USER],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [STORE.USERS, "notifications"],
    });

    invalidateQueries.mockClear();

    handleRoleCleanup(queryClient);
    for (const table of ROLE_SYNCED_TABLES) {
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: [table],
      });
    }
    for (const key of [
      QUERY_KEY.ALL_CATEGORIES,
      QUERY_KEY.CATEGORY_PAGE,
      QUERY_KEY.HOMEPAGE,
      QUERY_KEY.FEATURE_CONFIG,
      QUERY_KEY.SYNC_ROLE,
      QUERY_KEY.AUDIO_CACHE_LIST,
      QUERY_KEY.MATERIALS_CACHE_LIST,
    ]) {
      expect(invalidateQueries).toHaveBeenCalledWith({
        queryKey: [key],
      });
    }
  });

  it.concurrent("handleTableInvalidations invalidates modified query keys", () => {
    const invalidateQueries = vi.fn();
    const queryClient: any = { invalidateQueries };

    handleTableInvalidations(queryClient, [STORE.QUERY_REPLIES]);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [STORE.QUERY_REPLIES],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [STORE.USER_QUERIES],
    });

    handleTableInvalidations(queryClient, [STORE.ANNOUNCEMENTS]);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [STORE.ANNOUNCEMENTS],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.HOMEPAGE],
    });
  });

  it.concurrent("handleCategoryPathInvalidations invalidates paths and wildcards", () => {
    const invalidateQueries = vi.fn();
    const queryClient: any = { invalidateQueries };

    handleCategoryPathInvalidations(queryClient, ["*"]);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.ALL_CATEGORIES],
    });
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.CATEGORY_PAGE],
    });

    handleCategoryPathInvalidations(queryClient, ["gita/ch1"]);
    expect(invalidateQueries).toHaveBeenCalledWith({
      queryKey: [QUERY_KEY.CATEGORY_PAGE, "gita/ch1"],
    });
  });

  it.concurrent("handleSyncSuccess applies full sync result dispatching", () => {
    const invalidateQueries = vi.fn();
    const queryClient: any = { invalidateQueries };

    const syncResult: any = {
      clearedUser: false,
      clearedRole: false,
      changedTables: [STORE.RECORDINGS],
      changedCategoryPaths: ["gita"],
      changedIds: { recordings: [1, 2] },
      newAdditions: { recordings: [1] },
      rebuildSearchIndex: false,
    };

    handleSyncSuccess(syncResult, queryClient, "u1", "toast_1");
    expect(invalidateQueries).toHaveBeenCalled();
  });
});
