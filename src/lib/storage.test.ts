import { describe, expect, it, vi } from "vitest";

// Mock the constants module to have controlled base URLs for testing
vi.mock("@/constants", () => ({
  ASSET_BASE_URL: "https://assets.test.com/",
  AUDIO_BASE_URL: "https://audio.test.com/",
}));

import type { Category } from "@/types";
import { getAssetUrl, getAudioUrl, getCategoryImageUrl } from "./storage";

describe("storage utilities", () => {
  describe("getCategoryImageUrl", () => {
    it("should return null if category has no img_id", () => {
      const category = { id: 1, img_id: null } as Category;
      expect(getCategoryImageUrl(category)).toBeNull();
    });

    it("should return a formatted webp url based on img_id decoded to base36", () => {
      const category1 = { id: 1, img_id: 10 } as Category;
      // 10 in base 36 is 'a'
      expect(getCategoryImageUrl(category1)).toBe("/img/a.webp");

      const category2 = { id: 2, img_id: 12345 } as Category;
      // 12345 in base 36 is '9ix'
      expect(getCategoryImageUrl(category2)).toBe("/img/9ix.webp");
    });
  });

  describe("getAssetUrl", () => {
    it("should return the exact same URL if it already starts with http", () => {
      expect(getAssetUrl("http://external.com/image.jpg")).toBe(
        "http://external.com/image.jpg",
      );
      expect(getAssetUrl("https://external.com/image.jpg")).toBe(
        "https://external.com/image.jpg",
      );
    });

    it("should prepend ASSET_BASE_URL if it is a relative path or local ID", () => {
      expect(getAssetUrl("relative/path/file.png")).toBe(
        "https://assets.test.com/relative/path/file.png",
      );
      expect(getAssetUrl("some-id")).toBe("https://assets.test.com/some-id");
    });
  });

  describe("getAudioUrl", () => {
    it("should prepend AUDIO_BASE_URL to the audio file ID", () => {
      expect(getAudioUrl("lecture_123.mp3")).toBe(
        "https://audio.test.com/lecture_123.mp3",
      );
    });
  });
});
