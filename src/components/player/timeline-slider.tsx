"use client";
import { useAudioTimeline } from "@/hooks/use-audio";
import { Slider } from "@/components/ui/slider";

const formatTime = (secs: number) => {
  if (Number.isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

export function TimelineSlider() {
  const { currentTime, duration, seek } = useAudioTimeline();

  const handleValueChange = (values: number[]) => {
    if (values[0] !== undefined) {
      seek(values[0]);
    }
  };

  return (
    <div
      className="flex items-center gap-2 md:w-64"
      style={{ minWidth: "160px", flexGrow: 1 }}
    >
      <span
        className="text-xxs text-muted-foreground min-w-8"
        style={{ textAlign: "right" }}
      >
        {formatTime(currentTime)}
      </span>

      <Slider
        value={[currentTime]}
        min={0}
        max={duration || 100}
        step={1}
        onValueChange={handleValueChange}
        className="cursor-pointer"
        aria-label="Audio timeline slider"
      />

      <span className="text-xxs text-muted-foreground min-w-8 text-left">
        {formatTime(duration)}
      </span>
    </div>
  );
}
