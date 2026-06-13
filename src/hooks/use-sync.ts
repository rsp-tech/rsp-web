"use client";

import {
  type QueryClient,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/components/providers";
import {
  INVALIDATE_ALL_THRESHOLD,
  QUERY_KEY,
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  SYNC_INTERVAL,
  WORKER_MSG,
} from "@/constants";
import { getWorker, notifySearchWorker, useSearch } from "@/hooks/use-search";
import type { SearchableTable, SyncResult } from "@/types";

interface WorkerConfig {
  supabaseUrl: string;
  supabaseKey: string;
  accessToken: string;
  roleId?: number;
  isPublic?: boolean;
  queryClient: QueryClient;
}

type SyncWorkerMessage =
  | (SyncResult & { type: typeof WORKER_MSG.SUCCESS })
  | { type: typeof WORKER_MSG.ERROR; message: string }
  | { type: typeof WORKER_MSG.PROGRESS; message: string };

const runSync = ({ queryClient, ...config }: WorkerConfig): Promise<number> =>
  new Promise((resolve, reject) => {
    const worker = new Worker(new URL("@/workers/sync.ts", import.meta.url));
    worker.postMessage({ type: WORKER_MSG.START_SYNC, ...config });
    worker.onmessage = (e: MessageEvent<SyncWorkerMessage>) => {
      if (e.data.type === WORKER_MSG.SUCCESS) {
        worker.terminate();
        const result = e.data;
        const { changedCategoryPaths } = result;

        toast.success("Sync complete! Database updated.", {
          id: "sync-status",
        });

        queryClient.invalidateQueries({
          queryKey: [QUERY_KEY.CATEGORY_PAGE, "~"],
        });

        if (changedCategoryPaths.length > INVALIDATE_ALL_THRESHOLD) {
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
  const queryClient = useQueryClient();
  useSearch(); // ensure search worker is initialized alongside sync

  const roleId = toRoleId(session?.user.app_metadata.role_id);
  const isPublic = session?.user.app_metadata.is_public as boolean | undefined;

  const workerConfig = {
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_PUBLISHABLE_KEY,
    accessToken: session?.access_token ?? "",
    roleId,
    isPublic,
    queryClient,
  };
  return useQuery({
    queryKey: [QUERY_KEY.SYNC, roleId],
    queryFn: () => runSync(workerConfig),
    staleTime: SYNC_INTERVAL,
    refetchInterval: SYNC_INTERVAL,
    enabled: !isLoading,
  });
};
