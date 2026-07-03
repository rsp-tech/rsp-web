"use client";

import { X } from "lucide-react";
import { useAudioPlayback } from "@/hooks/use-audio";
import { PlaybackControls } from "./player/playback-controls";
import { TimelineSlider } from "./player/timeline-slider";
import { TrackInfo } from "./player/track-info";
import { VolumeControls } from "./player/volume-controls";
import { Button } from "./ui/button";

export function AudioPlayerPanel() {
  const { togglePlay } = useAudioPlayback();

  return (
    <div
      className="fixed z-50 bg-card border-t border-border shadow-md w-full p-4 select-none"
      style={{ bottom: 0, left: 0, right: 0 }}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Track Info (Static on tick) */}
        <TrackInfo />

        {/* Control Cluster */}
        <div className="flex flex-col md:flex-row items-center gap-4 flex-1 w-full md:w-auto">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <PlaybackControls />
            <TimelineSlider />
          </div>
          <VolumeControls />
        </div>
        <div className="flex-1"></div>

        {/* Close Button */}
        <div className="flex items-center justify-end shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={togglePlay}
            className="rounded-full h-8 w-8 flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
