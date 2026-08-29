import { describe, expect, it } from "vitest";
import { AudioCacheList } from "./audio-cache-list";
import { AudioCacheSettings } from "./audio-cache-settings";
import { AudioPlayerPanel } from "./audio-player-panel";
import { GlobalAudioPlayer } from "./global-audio-player";

describe.concurrent("audio player components suite", () => {
  it.concurrent("exports player views and modals", () => {
    expect(typeof AudioCacheList).toBe("function");
    expect(typeof AudioCacheSettings).toBe("function");
    expect(typeof AudioPlayerPanel).toBe("function");
    expect(typeof GlobalAudioPlayer).toBe("function");
  });
});
