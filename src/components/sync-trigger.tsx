"use client";

import { useNotificationSubscription } from "@/hooks/use-notification-subscription";
import { usePublicSync } from "@/hooks/use-public-sync";
import { useRoleSync } from "@/hooks/use-role-sync";
import { useUserSync } from "@/hooks/use-user-sync";

export const SyncTrigger = () => {
  usePublicSync();
  useRoleSync();
  useUserSync();
  useNotificationSubscription();
  return null;
};
