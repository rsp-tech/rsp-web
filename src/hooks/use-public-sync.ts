"use client";

import {
  type QueryClient,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEY, SYNC_INTERVAL, WORKER_MSG } from "@/constants";
import type { SyncWorkerMessage } from "@/types";
import { handleSyncSuccess } from "./sync-helpers";

export const runPublicSync = ({
  queryClient,
}: {
  queryClient: QueryClient;
}): Promise<number> =>
  new Promise((resolve, reject) => {
    const worker = new Worker(new URL("@/workers/sync.ts", import.meta.url));
    worker.postMessage({ type: WORKER_MSG.START_PUBLIC_SYNC });

    worker.onmessage = (e: MessageEvent<SyncWorkerMessage>) => {
      const { type } = e.data;

      if (type === WORKER_MSG.SUCCESS) {
        worker.terminate();
        handleSyncSuccess(e.data, queryClient);
        resolve(1);
      } else if (type === WORKER_MSG.PROGRESS) {
        toast.loading(e.data.message, { id: "sync-status" });
      } else if (type === WORKER_MSG.ERROR) {
        worker.terminate();
        toast.error(`Sync error: ${e.data.message}`, { id: "sync-status" });
        reject(new Error(e.data.message));
      }
    };

    worker.onerror = (e) => {
      worker.terminate();
      toast.error("Sync failed!", { id: "sync-status" });
      reject(e);
    };
  });

export const usePublicSync = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [QUERY_KEY.SYNC_PUBLIC],
    queryFn: () => runPublicSync({ queryClient }),
    staleTime: SYNC_INTERVAL,
    refetchOnMount: "always",
    refetchInterval: SYNC_INTERVAL,
    networkMode: "online",
  });
};
