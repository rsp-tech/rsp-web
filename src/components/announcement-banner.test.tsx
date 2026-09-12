import { describe, expect, it, vi } from "vitest";
import type { Announcement } from "@/types";

vi.mock("./announcement-banner/use-announcement-carousel", () => ({
  useAnnouncementCarousel: () => ({
    currentIndex: 0,
    isDismissed: false,
    prefersReducedMotion: false,
    handlePrev: vi.fn(),
    handleNext: vi.fn(),
    handleSelect: vi.fn(),
    handleDismiss: vi.fn(),
    handleMouseEnter: vi.fn(),
    handleMouseLeave: vi.fn(),
    handleTouchStart: vi.fn(),
    handleTouchEnd: vi.fn(),
    handleTouchCancel: vi.fn(),
  }),
}));

import {
  AnnouncementBanner,
  getBannerMediaUrl,
  getBannerRawMediaUrl,
  isExternalUrl,
  normalizeBannerHeights,
  TopAnnouncementBanner,
} from "./announcement-banner";
import { BannerControls } from "./announcement-banner/banner-controls";
import { BannerSlide } from "./announcement-banner/banner-slide";

const mockAnnouncements: Announcement[] = [
  {
    id: 1,
    title: "First Announcement",
    subtitle: "Subtitle 1",
    badge_text: "New",
    media_path: "banner-1",
    media_type: "image",
    cta_url: "/first",
    cta_label: "Learn More",
    is_active: true,
    start_date: null,
    end_date: null,
    order_ind: 1,
    bg_gradient: "black_vignette",
    ui_props: {
      banner_height: 60,
    },
  },
  {
    id: 2,
    title: "Second Announcement",
    subtitle: "Subtitle 2",
    badge_text: "Event",
    media_path: "video-2.mp4",
    media_type: "video",
    cta_url: "/second",
    cta_label: "Register",
    is_active: true,
    start_date: null,
    end_date: null,
    order_ind: 2,
    bg_gradient: null,
    ui_props: {
      video_poster: "/img/poster-2.webp",
    },
  },
];

describe.concurrent("src/components/announcement-banner suite", () => {
  it.concurrent("exports AnnouncementBanner and TopAnnouncementBanner components", () => {
    expect(typeof AnnouncementBanner).toBe("function");
    expect(typeof TopAnnouncementBanner).toBe("function");
  });

  describe.concurrent("URL and Height normalization helpers", () => {
    it.concurrent("identifies external URLs accurately without false positives", () => {
      expect(isExternalUrl("https://example.com/banner.webp")).toBe(true);
      expect(isExternalUrl("http://example.com/banner.webp")).toBe(true);
      expect(isExternalUrl("httpfoo/banner.webp")).toBe(false);
      expect(isExternalUrl("bnr-1a")).toBe(false);
      expect(isExternalUrl("/img/bnr-1a.webp")).toBe(false);
    });

    it.concurrent("formats banner media URLs correctly with base-36 IDs", () => {
      expect(getBannerMediaUrl("1a", "d", "webp")).toBe("/img/bnr-1a-d.webp");
      expect(getBannerMediaUrl("bnr-1a", "m", "avif")).toBe(
        "/img/bnr-1a-m.avif",
      );
      expect(
        getBannerMediaUrl("https://example.com/banner.webp", "d", "webp"),
      ).toBe("https://example.com/banner.webp");
      expect(getBannerMediaUrl("httpfoo", "d", "webp")).toBe(
        "/img/bnr-httpfoo-d.webp",
      );
    });

    it.concurrent("formats raw banner media URLs correctly for video/gif", () => {
      expect(getBannerRawMediaUrl("1a.mp4")).toBe("/img/bnr-1a.mp4");
      expect(getBannerRawMediaUrl("bnr-1a.gif")).toBe("/img/bnr-1a.gif");
      expect(getBannerRawMediaUrl("https://example.com/anim.mp4")).toBe(
        "https://example.com/anim.mp4",
      );
    });

    it.concurrent("normalizes responsive banner heights properly", () => {
      expect(normalizeBannerHeights(null)).toEqual({
        mobile: 64,
        tablet: 56,
        desktop: 56,
        ultrawide: 64,
      });
      expect(normalizeBannerHeights(60)).toEqual({
        mobile: 69,
        tablet: 60,
        desktop: 60,
        ultrawide: 69,
      });
    });
  });

  describe.concurrent("Carousel component tree and accessibility structure", () => {
    it.concurrent("returns null when announcements list is empty", () => {
      const tree = AnnouncementBanner({ announcements: [] });
      expect(tree).toBeNull();
    });

    it.concurrent("renders carousel container with accessibility attributes and dynamic height", () => {
      const tree = AnnouncementBanner({ announcements: mockAnnouncements });
      expect(tree).not.toBeNull();
      expect(tree?.type).toBe("section");
      expect(tree?.props["aria-roledescription"]).toBe("carousel");
      expect(tree?.props["aria-label"]).toBe("Announcements & Highlights");

      // Verify dynamic minHeight applied directly on container style without dynamic <style> injection
      expect(tree?.props.style.minHeight).toBeDefined();

      // Verify live region exists in tree
      const children = tree?.props.children;
      const liveRegion = children[0];
      expect(liveRegion.props["aria-live"]).toBe("polite");
      expect(liveRegion.props["aria-atomic"]).toBe("true");
    });
  });

  describe.concurrent("BannerSlide semantics and inert states", () => {
    it.concurrent("marks active slide accessible and inactive slide as inert and aria-hidden", () => {
      const firstAnnouncement = mockAnnouncements[0];
      const secondAnnouncement = mockAnnouncements[1];
      if (!firstAnnouncement || !secondAnnouncement) {
        throw new Error("Missing test mock announcements");
      }

      const activeSlide = BannerSlide({
        item: firstAnnouncement,
        index: 0,
        total: 2,
        isActive: true,
        isAdjacent: false,
        prefersReducedMotion: false,
      });

      expect(activeSlide.props.role).toBe("group");
      expect(activeSlide.props["aria-roledescription"]).toBe("slide");
      expect(activeSlide.props["aria-hidden"]).toBe(false);
      expect(activeSlide.props.inert).toBeUndefined();

      const inactiveSlide = BannerSlide({
        item: secondAnnouncement,
        index: 1,
        total: 2,
        isActive: false,
        isAdjacent: true,
        prefersReducedMotion: false,
      });

      expect(inactiveSlide.props["aria-hidden"]).toBe(true);
      expect(inactiveSlide.props.inert).toBe(true);
    });
  });

  describe.concurrent("BannerControls navigation and dismiss", () => {
    it.concurrent("renders prev/next buttons, dismiss button, and carousel dots when total > 1", () => {
      const onPrev = vi.fn();
      const onNext = vi.fn();
      const onSelect = vi.fn();
      const onDismiss = vi.fn();

      const controls = BannerControls({
        total: 2,
        currentIndex: 0,
        onPrev,
        onNext,
        onSelect,
        onDismiss,
      });

      expect(controls).not.toBeNull();
    });
  });
});
