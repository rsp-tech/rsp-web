"use client";

import { useCleanup } from "@/hooks/useCleanup";
import { useSync } from "@/hooks/useSync";

export function SyncTrigger() {
  useSync();
  useCleanup();
  return null;
}
