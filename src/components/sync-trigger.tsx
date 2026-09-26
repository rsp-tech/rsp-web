"use client";

import { useCleanup } from "@/hooks/use-cleanup";
import { useNotificationSubscription } from "@/hooks/use-notification-subscription";
import { usePublicSync } from "@/hooks/use-public-sync";
import { useRoleSync } from "@/hooks/use-role-sync";
import { useUserSync } from "@/hooks/use-user-sync";

export const SyncTrigger = () => {
  useCleanup();
  usePublicSync();
  useRoleSync();
  useUserSync();
  useNotificationSubscription();
  return null;
};
