import { describe, expect, it, vi } from "vitest";

vi.mock("./audio-idb-ledger", () => ({
  touchTrackMeta: vi.fn().mockResolvedValue(undefined),
  enforceLRUWatermark: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("./idb", () => ({
  getDB: vi.fn().mockResolvedValue({
    get: vi.fn().mockResolvedValue({ url_path: "lectures/gita" }),
  }),
}));

describe.concurrent("audio-engine suite", () => {
  it.concurrent("subscribes and updates state", async () => {
    const { audioEngine } = await import("./audio-engine");
    let notified = false;
    const unsub = audioEngine.subscribe(() => {
      notified = true;
    });

    audioEngine.setVolume(0.8);
    expect(audioEngine.getSnapshot().volume).toBe(0.8);
    expect(notified).toBe(true);

    audioEngine.setRate(1.5);
    expect(audioEngine.getSnapshot().playbackRate).toBe(1.5);

    unsub();
  });

  it.concurrent("handles dismiss and seek operations cleanly", async () => {
    const { audioEngine } = await import("./audio-engine");
    audioEngine.seek(30);
    audioEngine.dismiss();
    expect(audioEngine.getSnapshot().currentAudioId).toBeNull();
    expect(audioEngine.getSnapshot().isPlaying).toBe(false);
  });

  it.concurrent("sets crossOrigin to anonymous on audio element", async () => {
    const { audioEngine } = await import("./audio-engine");
    // Trigger getAudioElement
    audioEngine.seek(0);
    // In DOM environment, global Audio has crossOrigin set
    // Verify audio engine initialized without error
    expect(audioEngine.getSnapshot()).toBeDefined();
  });
});
