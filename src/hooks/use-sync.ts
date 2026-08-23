"use client";

import {
  type QueryClient,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/components/providers";
import {
  LOCAL_STORAGE,
  QUERY_KEY,
  STORE,
  SYNC_INTERVAL,
  USER_SPECIFIC_TABLES,
  WORKER_MSG,
} from "@/constants";
import { addSyncNotifications } from "@/hooks/use-notifications";
import { useOnlineStatus } from "@/hooks/use-online-status";
import {
  notifySearchWorker,
  rebuildSearchIndex,
  terminateSearchWorker,
} from "@/hooks/use-search";
import { toRoleId } from "@/lib/utils";
import type { SearchableTable, SyncResult } from "@/types";

interface WorkerConfig {
  accessToken: string;
  roleId?: number;
  isPublic?: boolean;
  userId?: string;
  targetTables?: string[];
}

type SyncWorkerMessage =
  | (SyncResult & { type: typeof WORKER_MSG.SUCCESS })
  | { type: typeof WORKER_MSG.ERROR; message: string }
  | { type: typeof WORKER_MSG.PROGRESS; message: string };

export const runSync = ({
  queryClient,
  ...config
}: WorkerConfig & {
  queryClient: QueryClient;
}): Promise<number> =>
  new Promise((resolve, reject) => {
    const worker = new Worker(new URL("@/workers/sync.ts", import.meta.url));
    worker.postMessage({ type: WORKER_MSG.START_SYNC, ...config });
    worker.onmessage = (e: MessageEvent<SyncWorkerMessage>) => {
      if (e.data.type === WORKER_MSG.SUCCESS) {
        worker.terminate();
        const {
          changedCategoryPaths,
          changedTables,
          clearedUser,
          clearedRole,
          newAdditions,
          rebuildSearchIndex: shouldRebuildSearchIndex,
          changedIds,
        } = e.data;

        toast.dismiss("sync-status");

        if (clearedUser) {
          try {
            localStorage.removeItem(LOCAL_STORAGE.READ_NOTIFICATIONS);
          } catch (err) {
            console.error(
              `Failed to clear ${LOCAL_STORAGE.READ_NOTIFICATIONS} from localStorage:`,
              err,
            );
          }
          USER_SPECIFIC_TABLES.forEach((table) => {
            queryClient.invalidateQueries({ queryKey: [table] });
          });
        }

        if (clearedRole) {
          terminateSearchWorker();
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEY.ALL_CATEGORIES],
          });
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEY.CATEGORY_PAGE],
          });
          rebuildSearchIndex(queryClient);
        }

        if (changedCategoryPaths.length) {
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEY.ALL_CATEGORIES],
          });
        }

        // Dynamically invalidate query keys for updated tables
        if (changedTables) {
          for (const table of changedTables) {
            queryClient.invalidateQueries({ queryKey: [table] });
          }

          if (config.userId) {
            const hasQueries = changedTables.includes(STORE.USER_QUERIES);
            const hasReplies = changedTables.includes(STORE.QUERY_REPLIES);
            const hasInterests = changedTables.includes(
              STORE.USER_SERVICE_INTERESTS,
            );
            const hasRequests = changedTables.includes(
              STORE.USER_EDIT_REQUESTS,
            );
            const hasUsers = changedTables.includes(STORE.USERS);

            if (hasQueries || hasReplies) {
              queryClient.invalidateQueries({
                queryKey: [STORE.USER_QUERIES, config.userId],
              });
            }
            if (hasInterests) {
              queryClient.invalidateQueries({
                queryKey: [STORE.USER_SERVICE_INTERESTS, config.userId],
              });
            }
            if (hasRequests) {
              queryClient.invalidateQueries({
                queryKey: [STORE.USER_EDIT_REQUESTS, config.userId],
              });
            }
            if (hasUsers) {
              queryClient.invalidateQueries({
                queryKey: [STORE.USERS, config.userId],
              });
            }
          }
        }

        if (Object.values(newAdditions).some((value) => value.length > 0)) {
          addSyncNotifications(newAdditions, config.userId);
          queryClient.invalidateQueries({
            queryKey: [STORE.USERS, "notifications"],
          });
        }

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

        if (shouldRebuildSearchIndex) {
          rebuildSearchIndex(queryClient);
        } else {
          for (const table of [
            STORE.RECORDINGS,
            STORE.CATEGORIES,
            STORE.MATERIALS,
          ] as const) {
            const ids = changedIds[table];
            if (ids?.length) notifySearchWorker(table as SearchableTable, ids);
          }
        }

        resolve(1);
      } else if (e.data.type === WORKER_MSG.PROGRESS) {
        toast.loading(e.data.message, { id: "sync-status" });
      } else if (e.data.type === WORKER_MSG.ERROR) {
        worker.terminate();
        toast.error(`Sync error: ${e.data.message}`, { id: "sync-status" });
        console.error(e.data.message);
        reject(new Error(e.data.message));
      }
    };
    worker.onerror = (e) => {
      worker.terminate();
      toast.error("Sync failed!", { id: "sync-status" });
      reject(e);
    };
  });

export const useSync = () => {
  const { session, isLoading } = useSession();
  const queryClient = useQueryClient();

  const isOnline = useOnlineStatus();

  const roleId = toRoleId(session?.user.app_metadata["role_id"]);
  const userId = session?.user?.id;
  const isPublic = session?.user.app_metadata["is_public"] as
    | boolean
    | undefined;

  const workerConfig = {
    accessToken: session?.access_token ?? "",
    roleId,
    isPublic,
    queryClient,
    userId,
  };

  return useQuery({
    queryKey: [QUERY_KEY.SYNC, roleId ?? "public", userId ?? "guest"],
    queryFn: () => runSync(workerConfig),
    staleTime: SYNC_INTERVAL,
    refetchOnMount: "always",
    refetchInterval: SYNC_INTERVAL,
    enabled: !isLoading && isOnline,
  });
};
