import { describe, expect, it } from "vitest";
import { getAssetProxyUrl, getAssetUrl } from "./storage";

describe.concurrent("storage utility suite", () => {
  it.concurrent("getAssetUrl and getAudioUrl resolve external vs internal asset URLs", () => {
    expect(getAssetUrl("https://example.com/asset.png")).toBe(
      "https://example.com/asset.png",
    );
    expect(getAssetUrl("http://example.com/asset.png")).toBe(
      "http://example.com/asset.png",
    );
    expect(getAssetUrl("assets/doc.pdf")).toContain("assets/doc.pdf");
    expect(getAssetProxyUrl("audio_sample.mp3")).toContain("audio_sample.mp3");
  });
});
