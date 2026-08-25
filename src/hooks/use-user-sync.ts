"use client";

import {
  type QueryClient,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { toast } from "sonner";
import { useSession } from "@/components/providers";
import { QUERY_KEY, SYNC_INTERVAL, WORKER_MSG } from "@/constants";
import { dispatchSyncJob } from "@/lib/sync-worker-client";
import { handleSyncSuccess } from "./sync-helpers";

const TOAST_ID = "sync-user-status";

export const runUserSync = async ({
  queryClient,
  userId,
  accessToken,
}: {
  queryClient: QueryClient;
  userId: string;
  accessToken: string;
}): Promise<number> => {
  try {
    const result = await dispatchSyncJob(
      {
        type: WORKER_MSG.START_USER_SYNC,
        userId,
        accessToken,
      },
      (msg) => toast.loading(msg, { id: TOAST_ID }),
    );
    handleSyncSuccess(result, queryClient, userId, TOAST_ID);
    return 1;
  } catch (err) {
    toast.error(`Sync error: ${(err as Error).message}`, { id: TOAST_ID });
    throw err;
  }
};

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
