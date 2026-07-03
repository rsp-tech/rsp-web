import { useSyncExternalStore } from "react";
import { audioEngine } from "@/lib/audio-engine";

/**
 * Provides basic controls and play states.
 * Prevents re-rendering components when the time changes.
 */
export const useAudioPlayback = () => {
  const isPlaying = useSyncExternalStore(
    audioEngine.subscribe,
    () => audioEngine.getSnapshot().isPlaying,
  );

  const currentAudioId = useSyncExternalStore(
    audioEngine.subscribe,
    () => audioEngine.getSnapshot().currentAudioId,
  );

  return {
    isPlaying,
    currentAudioId,
    togglePlay: audioEngine.togglePlay,
  };
};

/**
 * Detached hook specifically for scrubbers and timeline layouts.
 * Isolates high-frequency timeupdate re-renders.
 */
export const useAudioTimeline = () => {
  const currentTime = useSyncExternalStore(
    audioEngine.subscribe,
    () => audioEngine.getSnapshot().currentTime,
  );

  const duration = useSyncExternalStore(
    audioEngine.subscribe,
    () => audioEngine.getSnapshot().duration,
  );

  return {
    currentTime,
    duration,
    seek: audioEngine.seek,
  };
};

/**
 * Handles volume and audio playback rate modifications.
 */
export const useAudioConfiguration = () => {
  const volume = useSyncExternalStore(
    audioEngine.subscribe,
    () => audioEngine.getSnapshot().volume,
  );

  const playbackRate = useSyncExternalStore(
    audioEngine.subscribe,
    () => audioEngine.getSnapshot().playbackRate,
  );

  return {
    volume,
    playbackRate,
    setVolume: audioEngine.setVolume,
    setRate: audioEngine.setRate,
  };
};
