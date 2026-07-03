"use client";

import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAudioPlayback } from "@/hooks/use-audio";

export function PlayPauseButton() {
  const { isPlaying, togglePlay } = useAudioPlayback();

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={togglePlay}
      className="rounded-full shrink-0 justify-center items-center flex"
    >
      {isPlaying ? (
        <Pause className="w-4 h-4" />
      ) : (
        <Play className="w-4 h-4" style={{ marginLeft: "0.125rem" }} />
      )}
    </Button>
  );
}
