"use client";

import { Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useAudioConfiguration } from "@/hooks/use-audio";

export function VolumeControls() {
  const { volume, playbackRate, setVolume, setRate } = useAudioConfiguration();

  const handleSpeedClick = () => {
    const speeds = [1, 1.25, 1.5, 1.75, 2];
    const nextIndex = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    setRate(speeds[nextIndex]);
  };

  const toggleMute = () => {
    setVolume(volume > 0 ? 0 : 1);
  };

  return (
    <div className="flex items-center gap-3 shrink-0">
      <Button
        variant="outline"
        onClick={handleSpeedClick}
        className="text-xxs font-bold h-7 px-2"
      >
        {playbackRate}x
      </Button>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={toggleMute}
          className="text-muted-foreground hover:text-primary transition-colors cursor-pointer"
        >
          {volume === 0 ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </button>

        <Slider
          value={[volume * 100]}
          min={0}
          max={100}
          step={1}
          onValueChange={(vals) =>
            setVolume(vals[0] !== undefined ? vals[0] / 100 : 1)
          }
          className="w-16 cursor-pointer"
          aria-label="Volume slider"
        />
      </div>
    </div>
  );
}
