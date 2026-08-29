import { describe, expect, it } from "vitest";
import { useVideo } from "./use-video";

describe.concurrent("use-video suite", () => {
  it.concurrent("updates video id and title using setYt", () => {
    useVideo.getState()?.setYt("dQw4w9WgXcQ", "Spiritual Lecture");
    expect(useVideo.getState()?.ytId).toBe("dQw4w9WgXcQ");
    expect(useVideo.getState()?.title).toBe("Spiritual Lecture");
  });
});
