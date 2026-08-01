"use client";

import { useCleanup } from "@/hooks/use-cleanup";
import { useSync } from "@/hooks/use-sync";

export const SyncTrigger = () => {
  useSync();
  useCleanup();
  return null;
};
