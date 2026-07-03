"use client";

import { ExternalLink, Maximize2, Music, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useAudioPlayback } from "@/hooks/use-audio";
import { audioEngine } from "@/lib/audio-engine";
import { categoryPath } from "@/lib/utils";
import { ControlBtns } from "./player/control-btns";
import { PlayPauseButton } from "./player/play-pause-button";
import { TimelineSlider } from "./player/timeline-slider";
import { Button } from "./ui/button";

export function AudioPlayerPanel() {
  const { currentRecording, categoryPath: categoryPathVal } =
    useAudioPlayback();
  const [isMinimized, setIsMinimized] = useState(false);

  // Sync isMinimized with sessionStorage for persistent layout across route switches
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("audio-player-minimized");
      if (saved === "true") {
        setIsMinimized(true);
      }
    }
  }, []);

  const handleMinimizeToggle = (val: boolean) => {
    setIsMinimized(val);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("audio-player-minimized", String(val));
    }
  };

  if (isMinimized) {
    return (
      <div
        className="fixed z-50 bg-muted/50 border border-border shadow-md rounded-full flex items-center gap-2 p-1 select-none backdrop-blur-xs"
        style={{
          bottom: "24px",
          right: "24px",
        }}
      >
        {/* Clickable area to expand */}
        <button
          type="button"
          onClick={() => handleMinimizeToggle(false)}
          className="flex items-center gap-2 cursor-pointer p-2 rounded-full hover:bg-accent text-muted-foreground hover:text-primary transition-colors"
          title="Expand player"
        >
          <Music className="w-4 h-4 shrink-0 text-primary animate-pulse" />
          <span
            className="hidden md:flex text-xs font-bold truncate text-primary"
            style={{ maxWidth: "8rem" }}
          >
            {currentRecording?.name || "Active Recording"}
          </span>
          <Maximize2 className="w-3 h-3 shrink-0" />
        </button>

        {/* Controls inside minimized pill */}
        <div className="flex items-center gap-1 shrink-0">
          <PlayPauseButton />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => audioEngine.dismiss()}
            className="rounded-full h-8 w-8 flex items-center justify-center cursor-pointer"
            title="Dismiss Player"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  const title = currentRecording?.name || "Active Recording";
  const speakers =
    currentRecording?.speakers?.map((s) => s.name).join(", ") ||
    "Spiritual Discourse";

  // Resolve navigation path
  const path = categoryPathVal ? categoryPath(categoryPathVal) : "";
  const href = path
    ? `/${path}?q=${currentRecording?.id}`
    : `?q=${currentRecording?.id}`;

  return (
    <div
      className="bg-muted border-t border-border shadow-md w-full p-4 select-none z-50"
      style={{
        bottom: 0,
        position: "sticky",
      }}
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Metadata Section */}
        <div className="flex flex-col gap-1 w-full md:w-72">
          <div className="flex items-center gap-1">
            <h4
              className="font-bold text-sm truncate text-primary"
              title={title}
            >
              {title}
            </h4>
            <Link
              href={href}
              className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors cursor-pointer rounded-md p-1 hover:bg-accent shrink-0"
              title="Navigate to recording details"
            >
              <ExternalLink className="w-3 h-3" />
            </Link>
          </div>

          {/* Speaker / Mobile Buttons Row */}
          <div className="flex items-center justify-between gap-3">
            <span
              className="text-xs text-muted-foreground truncate"
              title={speakers}
            >
              {speakers}
            </span>

            <ControlBtns {...{ handleMinimizeToggle }} forMobile />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
          <PlayPauseButton />
          <TimelineSlider />
        </div>

        {/* Desktop-only Action Buttons */}
        <ControlBtns {...{ handleMinimizeToggle }} />
      </div>
    </div>
  );
}
