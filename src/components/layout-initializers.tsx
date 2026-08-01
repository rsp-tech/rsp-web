"use client";

import dynamic from "next/dynamic";
import { OfflineIndicator } from "@/components/offline-indicator";
import { ProgressBar } from "@/components/progress-bar";
import { SyncTrigger } from "@/components/sync-trigger";
import { Toaster } from "@/components/ui/sonner";

const MediaPreviewModal = dynamic(
  () =>
    import("@/components/media-preview-modal").then(
      (mod) => mod.MediaPreviewModal,
    ),
  { ssr: false },
);

export function LayoutInitializers() {
  return (
    <>
      <OfflineIndicator />
      <SyncTrigger />
      <Toaster position="bottom-right" />
      <ProgressBar />
      <MediaPreviewModal />
    </>
  );
}
