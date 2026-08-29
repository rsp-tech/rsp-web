"use client";

import {
  type QueryClient,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSession } from "@/components/providers";
import { QUERY_KEY, SYNC_INTERVAL, WORKER_MSG } from "@/constants";
import { dispatchSyncJob } from "@/lib/sync-worker-client";
import { toRoleId } from "@/lib/utils";
import { executeSyncJob } from "./sync-helpers";

const TOAST_ID = "role-sync-status";

export const runRoleSync = ({
  queryClient,
  roleId,
  userId,
  accessToken,
}: {
  queryClient: QueryClient;
  roleId: number;
  userId: string;
  accessToken: string;
}): Promise<number> =>
  executeSyncJob({
    job: {
      type: WORKER_MSG.START_ROLE_SYNC,
      roleId,
      userId,
      accessToken,
    },
    queryClient,
    userId,
    toastId: TOAST_ID,
    dispatch: dispatchSyncJob,
  });

export const useRoleSync = () => {
  const { session, isLoading } = useSession();
  const queryClient = useQueryClient();

  const roleId = toRoleId(session?.user.app_metadata["role_id"]);
  const isPublic = session?.user.app_metadata["is_public"] as
    | boolean
    | undefined;
  const userId = session?.user?.id;
  const accessToken = session?.access_token ?? "";

  return useQuery({
    queryKey: [QUERY_KEY.SYNC_ROLE, roleId, userId],
    queryFn: () =>
      runRoleSync({
        queryClient,
        roleId: roleId as number,
        userId: userId as string,
        accessToken,
      }),
    staleTime: SYNC_INTERVAL,
    refetchOnMount: "always",
    refetchInterval: SYNC_INTERVAL,
    networkMode: "online",
    enabled: !isLoading && Boolean(userId && roleId) && !isPublic,
  });
};
