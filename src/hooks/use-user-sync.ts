"use client";

import {
  type QueryClient,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/components/providers";
import { QUERY_KEY, SYNC_INTERVAL, WORKER_MSG } from "@/constants";
import type { SyncWorkerMessage } from "@/types";
import { handleSyncSuccess } from "./sync-helpers";

export const runUserSync = ({
  queryClient,
  userId,
  accessToken,
}: {
  queryClient: QueryClient;
  userId: string;
  accessToken: string;
}): Promise<number> =>
  new Promise((resolve, reject) => {
    const worker = new Worker(new URL("@/workers/sync.ts", import.meta.url));
    worker.postMessage({
      type: WORKER_MSG.START_USER_SYNC,
      userId,
      accessToken,
    });

    worker.onmessage = (e: MessageEvent<SyncWorkerMessage>) => {
      const { type } = e.data;

      if (type === WORKER_MSG.SUCCESS) {
        worker.terminate();
        handleSyncSuccess(e.data, queryClient, userId);
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

export const useUserSync = () => {
  const { session, isLoading } = useSession();
  const queryClient = useQueryClient();

  const userId = session?.user?.id;
  const accessToken = session?.access_token ?? "";

  return useQuery({
    queryKey: [QUERY_KEY.SYNC_USER, userId],
    queryFn: () =>
      runUserSync({
        queryClient,
        userId: userId as string,
        accessToken,
      }),
    staleTime: SYNC_INTERVAL,
    refetchOnMount: "always",
    refetchInterval: SYNC_INTERVAL,
    networkMode: "online",
    enabled: !isLoading && Boolean(userId),
  });
};
