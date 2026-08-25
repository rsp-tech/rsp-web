import type { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEY, STORE, USER_SPECIFIC_TABLES } from "@/constants";
import {
  addSyncNotifications,
  clearNotificationStorage,
} from "@/hooks/use-notifications";
import {
  notifySearchWorker,
  rebuildSearchIndex,
  terminateSearchWorker,
} from "@/hooks/use-search";
import type { SearchableTable, SyncNewAdditions, SyncResult } from "@/types";

export const handleUserCleanup = (queryClient: QueryClient) => {
  clearNotificationStorage();
  for (const table of USER_SPECIFIC_TABLES) {
    queryClient.invalidateQueries({ queryKey: [table] });
  }
};

export const handleRoleCleanup = (queryClient: QueryClient) => {
  terminateSearchWorker();
  for (const key of [QUERY_KEY.ALL_CATEGORIES, QUERY_KEY.CATEGORY_PAGE]) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
  rebuildSearchIndex(queryClient);
};

export const handleTableInvalidations = (
  queryClient: QueryClient,
  changedTables: string[],
) => {
  for (const table of changedTables) {
    queryClient.invalidateQueries({ queryKey: [table] });
  }

  if (
    changedTables.includes(STORE.QUERY_REPLIES) &&
    !changedTables.includes(STORE.USER_QUERIES)
  ) {
    queryClient.invalidateQueries({
      queryKey: [STORE.USER_QUERIES],
    });
  }
};

export const handleCategoryPathInvalidations = (
  queryClient: QueryClient,
  changedCategoryPaths: string[],
) => {
  if (!changedCategoryPaths?.length) return;

  queryClient.invalidateQueries({
    queryKey: [QUERY_KEY.ALL_CATEGORIES],
  });

  if (changedCategoryPaths.includes("*")) {
    queryClient.invalidateQueries({
      queryKey: [QUERY_KEY.CATEGORY_PAGE],
    });
  } else {
    for (const path of changedCategoryPaths) {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.CATEGORY_PAGE, path],
      });
    }
  }
};

export const handleNotifications = (
  queryClient: QueryClient,
  newAdditions: SyncNewAdditions,
  userId?: string,
) => {
  const hasNewItems = Object.keys(newAdditions).some(
    (key) => newAdditions[key as keyof SyncNewAdditions].length > 0,
  );
  if (!hasNewItems) return;

  addSyncNotifications(newAdditions, userId);
  queryClient.invalidateQueries({
    queryKey: [STORE.USERS, "notifications"],
  });
};

export const handleSearchUpdates = (
  queryClient: QueryClient,
  rebuildSearch: boolean,
  changedIds: SyncResult["changedIds"],
) => {
  if (rebuildSearch) {
    rebuildSearchIndex(queryClient);
    return;
  }

  for (const table of [
    STORE.RECORDINGS,
    STORE.CATEGORIES,
    STORE.MATERIALS,
  ] as const) {
    const ids = changedIds[table];
    if (ids?.length) notifySearchWorker(table as SearchableTable, ids);
  }
};

export const handleSyncSuccess = (
  result: SyncResult,
  queryClient: QueryClient,
  userId?: string,
  toastId?: string,
) => {
  toast.dismiss(toastId || "sync-status");

  if (result.clearedUser) handleUserCleanup(queryClient);
  if (result.clearedRole) handleRoleCleanup(queryClient);

  handleTableInvalidations(queryClient, result.changedTables);

  handleCategoryPathInvalidations(queryClient, result.changedCategoryPaths);
  handleNotifications(queryClient, result.newAdditions, userId);
  handleSearchUpdates(
    queryClient,
    result.rebuildSearchIndex,
    result.changedIds,
  );
};
