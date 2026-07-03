"use client";

import dynamic from "next/dynamic";
import { useAudioPlayback } from "@/hooks/use-audio";

// Dynamically import the player panel only when audio is active
const PlayerPanel = dynamic(
  () => import("./audio-player-panel").then((mod) => mod.AudioPlayerPanel),
  { ssr: false },
);

export function GlobalAudioPlayer() {
  const { currentAudioId } = useAudioPlayback();

  if (!currentAudioId) return null;

  return <PlayerPanel />;
}
