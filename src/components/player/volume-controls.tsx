"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useAudioConfiguration } from "@/hooks/use-audio";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Slider } from "../ui/slider";

export const VolumeControlPopover = () => {
  const { volume, setVolume } = useAudioConfiguration();
  const toggleMute = () => {
    setVolume(volume > 0 ? 0 : 1);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="rounded-full h-8 w-8 flex items-center justify-center cursor-pointer shrink-0"
        >
          {volume === 0 ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="center" side="top" asChild>
        <div className="flex-row gap-2" style={{ width: "12rem" }}>
          <Button
            type="button"
            onClick={toggleMute}
            variant="ghost"
            title={volume === 0 ? "Unmute" : "Mute"}
          >
            {volume === 0 ? (
              <VolumeX className="w-4 h-4" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
          </Button>
          <Slider
            value={[volume * 100]}
            min={0}
            max={100}
            step={1}
            onValueChange={(vals) =>
              setVolume(vals[0] !== undefined ? vals[0] / 100 : 1)
            }
            className="cursor-pointer"
            aria-label="Volume slider"
          />
        </div>
      </PopoverContent>
    </Popover>
  );
};
