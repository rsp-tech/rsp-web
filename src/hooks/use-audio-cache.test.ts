import { describe, expect, it } from "vitest";
import {
  DEFAULT_SETTINGS,
  getAudioCacheSettings,
  useAudioCacheList,
} from "./use-audio-cache";

describe.concurrent("use-audio-cache hook suite", () => {
  it.concurrent("getAudioCacheSettings retrieves and parses settings safely", () => {
    expect(getAudioCacheSettings()).toEqual(DEFAULT_SETTINGS);

    localStorage.setItem(
      "rsp-audio-settings",
      JSON.stringify({ maxCacheSizeMB: 300 }),
    );
    expect(getAudioCacheSettings()).toEqual({ maxCacheSizeMB: 300 });

    localStorage.setItem("rsp-audio-settings", "corrupt");
    expect(getAudioCacheSettings()).toEqual(DEFAULT_SETTINGS);
    localStorage.removeItem("rsp-audio-settings");
  });

  it.concurrent("exports useAudioCacheList hook", () => {
    expect(typeof useAudioCacheList).toBe("function");
  });
});
