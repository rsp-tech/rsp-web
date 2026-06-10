"use client";

import { useCleanup } from "@/hooks/use-cleanup";
import { useSync } from "@/hooks/use-sync";

export function SyncTrigger() {
  useSync();
  useCleanup();
  return null;
}
