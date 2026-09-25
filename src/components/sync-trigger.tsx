"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { QUERY_KEY } from "@/constants";
import { useCleanup } from "@/hooks/use-cleanup";
import { useNotificationSubscription } from "@/hooks/use-notification-subscription";
import { usePublicSync } from "@/hooks/use-public-sync";
import { useRoleSync } from "@/hooks/use-role-sync";
import { useUserSync } from "@/hooks/use-user-sync";

export const SyncTrigger = () => {
  useCleanup();
  usePublicSync();
  const { hasRole, isSyncingOrPendingAuth } = useRoleSync();
  useUserSync();
  useNotificationSubscription();

  const queryClient = useQueryClient();
  useEffect(() => {
    if (!hasRole || isSyncingOrPendingAuth) return;
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY.CATEGORY_PAGE] });
  }, [hasRole, isSyncingOrPendingAuth, queryClient]);
  return null;
};
