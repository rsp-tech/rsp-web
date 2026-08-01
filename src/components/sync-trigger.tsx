"use client";

import { useCleanup } from "@/hooks/use-cleanup";
import { useNotificationSubscription } from "@/hooks/use-notification-subscription";
import { useSync } from "@/hooks/use-sync";

export const SyncTrigger = () => {
  useSync();
  useCleanup();
  useNotificationSubscription();
  return null;
};
