"use client";

import { useCleanup } from "@/hooks/use-cleanup";
import { useNotificationListener } from "@/hooks/use-notification-listener";
import { useSync } from "@/hooks/use-sync";

export const SyncTrigger = () => {
  useSync();
  useCleanup();
  useNotificationListener();
  return null;
};
