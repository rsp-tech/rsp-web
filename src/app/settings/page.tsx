import type { Metadata } from "next";
import { AudioCacheSettings } from "@/components/audio-cache-settings";

export const metadata: Metadata = {
  title: "Local Cache Settings",
  description:
    "Configure local audio caching policies, limits, and manage downloaded lectures.",
};

export default function SettingsPage() {
  return (
    <div className="max-w-5xl mx-auto py-6 flex flex-col gap-6">
      <div className="flex flex-col gap-2 border-b border-border pb-4">
        <h1 className="text-3xl font-bold font-heading tracking-tight">
          Settings
        </h1>
        <p className="text-muted-foreground text-sm">
          Configure offline audio settings and inspect storage usage.
        </p>
      </div>
      <AudioCacheSettings />
    </div>
  );
}
