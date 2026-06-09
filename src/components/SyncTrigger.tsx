"use client";

import { useSync } from "@/hooks/useSync";

export function SyncTrigger() {
  useSync();
  return null;
}
