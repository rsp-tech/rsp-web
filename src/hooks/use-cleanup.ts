"use client";

import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSession } from "@/components/providers";
import { WORKER_MSG } from "@/constants";
import { dispatchSyncJob } from "@/lib/sync-worker-client";
import { toRoleId } from "@/lib/utils";
import { handleRoleCleanup, handleUserCleanup } from "./sync-helpers";

export const runCleanup = async ({
  queryClient,
  roleId,
  userId,
}: {
  queryClient: QueryClient;
  roleId?: number;
  userId?: string;
}): Promise<void> => {
  const result = await dispatchSyncJob({
    type: WORKER_MSG.START_CLEANUP,
    roleId,
    userId,
  });

  if (result.clearedUser) handleUserCleanup(queryClient);
  if (result.clearedRole) handleRoleCleanup(queryClient);
};

export const useCleanup = () => {
  const { session, isLoading } = useSession();
  const queryClient = useQueryClient();

  const userId = session?.user?.id;
  const roleId = toRoleId(session?.user.app_metadata["role_id"]);

  useEffect(() => {
    if (isLoading) return;
    runCleanup({ queryClient, roleId, userId }).catch((err) => {
      console.error("Cleanup failed:", err);
    });
  }, [isLoading, userId, roleId, queryClient]);
};
