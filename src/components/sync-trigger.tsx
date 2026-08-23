"use client";

import { useNotificationSubscription } from "@/hooks/use-notification-subscription";
import { useSync } from "@/hooks/use-sync";

export const SyncTrigger = () => {
  useSync();
  useNotificationSubscription();
  return null;
};
