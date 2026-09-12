"use client";

import dynamic from "next/dynamic";
import { AdminFeatureFlagBar } from "@/components/admin-feature-flag-bar";
import { FestiveOverlays } from "@/components/festive-overlays";
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

export const LayoutInitializers = () => {
  return (
    <>
      <OfflineIndicator />
      <SyncTrigger />
      <Toaster position="bottom-right" />
      <ProgressBar />
      <MediaPreviewModal />
      <AdminFeatureFlagBar />
      <FestiveOverlays />
    </>
  );
};
