import { describe, expect, it } from "vitest";
import type { Category } from "@/types";
import { getAssetProxyUrl, getAssetUrl, getCategoryImageUrl } from "./storage";

describe.concurrent("storage utility suite", () => {
  it.concurrent("getCategoryImageUrl creates base36 image URLs", () => {
    expect(getCategoryImageUrl({ img_id: 100 } as Category)).toBe(
      "/img/2s.webp",
    );
    expect(
      getCategoryImageUrl({ img_id: null } as unknown as Category),
    ).toBeNull();
  });

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
