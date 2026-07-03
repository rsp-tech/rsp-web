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
    () => false,
  );

  const currentAudioId = useSyncExternalStore(
    audioEngine.subscribe,
    () => audioEngine.getSnapshot().currentAudioId,
    () => null,
  );

  const currentRecording = useSyncExternalStore(
    audioEngine.subscribe,
    () => audioEngine.getSnapshot().currentRecording,
    () => null,
  );

  const categoryPath = useSyncExternalStore(
    audioEngine.subscribe,
    () => audioEngine.getSnapshot().categoryPath,
    () => null,
  );

  return {
    isPlaying,
    currentAudioId,
    currentRecording,
    categoryPath,
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
    () => 0,
  );

  const duration = useSyncExternalStore(
    audioEngine.subscribe,
    () => audioEngine.getSnapshot().duration,
    () => 0,
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
    () => 1,
  );

  const playbackRate = useSyncExternalStore(
    audioEngine.subscribe,
    () => audioEngine.getSnapshot().playbackRate,
    () => 1,
  );

  return {
    volume,
    playbackRate,
    setVolume: audioEngine.setVolume,
    setRate: audioEngine.setRate,
  };
};
