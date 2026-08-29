"use client";

import {
  type QueryClient,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSession } from "@/components/providers";
import { QUERY_KEY, SYNC_INTERVAL, WORKER_MSG } from "@/constants";
import { dispatchSyncJob } from "@/lib/sync-worker-client";
import { executeSyncJob } from "./sync-helpers";

const TOAST_ID = "sync-user-status";

export const runUserSync = ({
  queryClient,
  userId,
  accessToken,
}: {
  queryClient: QueryClient;
  userId: string;
  accessToken: string;
}): Promise<number> =>
  executeSyncJob({
    job: {
      type: WORKER_MSG.START_USER_SYNC,
      userId,
      accessToken,
    },
    queryClient,
    userId,
    toastId: TOAST_ID,
    dispatch: dispatchSyncJob,
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
