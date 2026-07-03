import { useState } from "react";
import { useAudioConfiguration } from "@/hooks/use-audio";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

const SPEEDS = [0.75, 1.0, 1.25, 1.5, 2.0];

export const SpeedControlPopover = () => {
  const [speedOpen, setSpeedOpen] = useState(false);
  const { playbackRate, setRate } = useAudioConfiguration();

  return (
    <Popover open={speedOpen} onOpenChange={setSpeedOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="text-xxs font-bold h-8 px-2.5 cursor-pointer rounded-full shrink-0 flex items-center justify-center border border-border"
        >
          {playbackRate}x
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-2 flex flex-col gap-1 bg-popover"
        align="center"
        side="top"
        style={{ width: "8rem" }}
      >
        {SPEEDS.map((rate) => (
          <button
            key={rate}
            type="button"
            onClick={() => {
              setRate(rate);
              setSpeedOpen(false);
            }}
            className={cn(
              "w-full text-left text-xs px-2.5 py-1.5 rounded-md transition-colors cursor-pointer hover:bg-accent hover:text-accent-foreground",
              playbackRate === rate
                ? "bg-muted font-bold text-primary"
                : "text-muted-foreground",
            )}
          >
            {rate}x
          </button>
        ))}
      </PopoverContent>
    </Popover>
  );
};
