"use client";

import dynamic from "next/dynamic";

// These are now safely deferred on the client side
const Toaster = dynamic(
  () => import("@/components/ui/sonner").then((mod) => mod.Toaster),
  { ssr: false },
);

const OfflineIndicator = dynamic(
  () =>
    import("@/components/offline-indicator").then(
      (mod) => mod.OfflineIndicator,
    ),
  { ssr: false },
);

const SyncTrigger = dynamic(
  () => import("@/components/sync-trigger").then((mod) => mod.SyncTrigger),
  { ssr: false },
);

const GlobalAudioPlayer = dynamic(
  () =>
    import("@/components/global-audio-player").then(
      (mod) => mod.GlobalAudioPlayer,
    ),
  { ssr: false },
);

export function LayoutInitializers() {
  return (
    <>
      <OfflineIndicator />
      <SyncTrigger />
      <Toaster position="bottom-right" />
      <GlobalAudioPlayer />
    </>
  );
}
