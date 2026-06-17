"use client";

import {
  type QueryClient,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/components/providers";
import { QUERY_KEY, SYNC_INTERVAL, WORKER_MSG } from "@/constants";
import { getWorker, notifySearchWorker, useSearch } from "@/hooks/use-search";
import type { Category, SearchableTable, SyncResult } from "@/types";
import { useCategories } from "./use-categories";

interface WorkerConfig {
  accessToken: string;
  roleId?: number;
  isPublic?: boolean;
}

type SyncWorkerMessage =
  | (SyncResult & { type: typeof WORKER_MSG.SUCCESS })
  | { type: typeof WORKER_MSG.ERROR; message: string }
  | { type: typeof WORKER_MSG.PROGRESS; message: string };

const runSync = ({
  queryClient,
  categories,
  ...config
}: WorkerConfig & {
  queryClient: QueryClient;
  categories: Category[] | undefined;
}): Promise<number> =>
  new Promise((resolve, reject) => {
    const worker = new Worker(new URL("@/workers/sync.ts", import.meta.url));
    worker.postMessage({ type: WORKER_MSG.START_SYNC, ...config });
    worker.onmessage = (e: MessageEvent<SyncWorkerMessage>) => {
      if (e.data.type === WORKER_MSG.SUCCESS) {
        worker.terminate();
        const result = e.data;
        const { changedCategoryPaths } = result;

        toast.success("Sync complete!", {
          id: "sync-status",
        });

        if (changedCategoryPaths.length) {
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEY.ALL_CATEGORIES],
          });
        }

        if (changedCategoryPaths.includes("*")) {
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEY.CATEGORY_PAGE],
          });
        } else {
          for (const path of changedCategoryPaths) {
            queryClient.invalidateQueries({
              queryKey: [
                QUERY_KEY.CATEGORY_PAGE,
                typeof path === "string"
                  ? path
                  : (categories?.find((c) => c.id === path)?.url_path ?? "~"),
              ],
            });
          }
        }

        if (result.rebuildSearchIndex) {
          getWorker().postMessage({ type: WORKER_MSG.BUILD_INDEX });
        } else {
          for (const table of [
            "recordings",
            "categories",
            "materials",
          ] satisfies SearchableTable[]) {
            const ids = result.changedIds[table];
            if (ids?.length) notifySearchWorker(table, ids);
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
      toast.error("Critical sync worker error occurred", { id: "sync-status" });
      reject(e);
    };
  });

const toRoleId = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isInteger(value) ? value : undefined;

export const useSync = () => {
  const { session, isLoading } = useSession();
  const { data } = useCategories();
  const queryClient = useQueryClient();
  useSearch(); // ensure search worker is initialized alongside sync

  const roleId = toRoleId(session?.user.app_metadata.role_id);
  const isPublic = session?.user.app_metadata.is_public as boolean | undefined;

  const workerConfig = {
    accessToken: session?.access_token ?? "",
    roleId,
    isPublic,
    queryClient,
    categories: data,
  };
  return useQuery({
    queryKey: [QUERY_KEY.SYNC, roleId],
    queryFn: () => runSync(workerConfig),
    staleTime: SYNC_INTERVAL,
    refetchInterval: SYNC_INTERVAL,
    enabled: !isLoading,
  });
};
