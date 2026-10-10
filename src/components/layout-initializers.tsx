"use client";

import { FestiveOverlays } from "@/components/festive-overlays";
import { MediaPreviewModal } from "@/components/media-preview-modal";
import { OfflineIndicator } from "@/components/offline-indicator";
import { ProgressBar } from "@/components/progress-bar";
import { SyncTrigger } from "@/components/sync-trigger";
import { Toaster } from "@/components/ui/sonner";

export const LayoutInitializers = () => {
  return (
    <>
      <OfflineIndicator />
      <SyncTrigger />
      <Toaster position="bottom-right" />
      <ProgressBar />
      <MediaPreviewModal />
      <FestiveOverlays />
    </>
  );
};
