import { describe, expect, it } from "vitest";
import {
  AnnouncementBanner,
  getBannerMediaUrl,
  getBannerRawMediaUrl,
} from "./announcement-banner";

describe.concurrent("src/components/announcement-banner.tsx suite", () => {
  it.concurrent("exports AnnouncementBanner component", () => {
    expect(typeof AnnouncementBanner).toBe("function");
  });

  it.concurrent("formats banner media URLs correctly with base-36 IDs", () => {
    expect(getBannerMediaUrl("1a", "d", "webp")).toBe("/img/bnr-1a-d.webp");
    expect(getBannerMediaUrl("bnr-1a", "m", "avif")).toBe("/img/bnr-1a-m.avif");
    expect(
      getBannerMediaUrl("https://example.com/banner.webp", "d", "webp"),
    ).toBe("https://example.com/banner.webp");
  });

  it.concurrent("formats raw banner media URLs correctly for video/gif", () => {
    expect(getBannerRawMediaUrl("1a.mp4")).toBe("/img/bnr-1a.mp4");
    expect(getBannerRawMediaUrl("bnr-1a.gif")).toBe("/img/bnr-1a.gif");
    expect(getBannerRawMediaUrl("https://example.com/anim.mp4")).toBe(
      "https://example.com/anim.mp4",
    );
  });
});
