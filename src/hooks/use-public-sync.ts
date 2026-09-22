"use client";

import {
  type QueryClient,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { QUERY_KEY, SYNC_INTERVAL, WORKER_MSG } from "@/constants";
import { dispatchSyncJob } from "@/lib/sync-worker-client";
import { handleSyncSuccess } from "./sync-helpers";

const TOAST_ID = "sync-public-status";

export const runPublicSync = async ({
  queryClient,
}: {
  queryClient: QueryClient;
}): Promise<number> => {
  try {
    const result = await dispatchSyncJob(
      { type: WORKER_MSG.START_PUBLIC_SYNC },
      (msg) => toast.loading(msg, { id: TOAST_ID }),
    );
    handleSyncSuccess(result, queryClient, undefined, TOAST_ID);
    return 1;
  } catch (err) {
    console.error("[Client Sync] Sync job failed:", err);
    toast.error(`Sync error: ${(err as Error).message}`, { id: TOAST_ID });
    throw err;
  }
};

export const usePublicSync = () => {
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: [QUERY_KEY.SYNC_PUBLIC],
    queryFn: () => runPublicSync({ queryClient }),
    staleTime: SYNC_INTERVAL,
    refetchOnMount: false,
    refetchInterval: SYNC_INTERVAL,
    networkMode: "online",
  });
};
