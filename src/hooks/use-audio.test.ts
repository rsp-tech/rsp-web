import { describe, expect, it, vi } from "vitest";

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useSyncExternalStore: (subscribe: any, getSnapshot: any) => getSnapshot(),
  };
});

import {
  useAudioConfiguration,
  useAudioPlayback,
  useAudioTimeline,
} from "./use-audio";


describe.concurrent("use-audio hook suite", () => {
  it.concurrent("useAudioPlayback returns playback control getters", () => {
    const playback = useAudioPlayback();
    expect(playback.isPlaying).toBe(false);
    expect(typeof playback.togglePlay).toBe("function");
  });

  it.concurrent("useAudioTimeline returns time and duration getters", () => {
    const timeline = useAudioTimeline();
    expect(timeline.currentTime).toBe(0);
    expect(timeline.duration).toBe(0);
    expect(typeof timeline.seek).toBe("function");
  });

  it.concurrent("useAudioConfiguration returns volume and rate settings getters", () => {
    const config = useAudioConfiguration();
    expect(config.volume).toBe(1);
    expect(config.playbackRate).toBe(1);
    expect(typeof config.setVolume).toBe("function");
    expect(typeof config.setRate).toBe("function");
  });
});


