import { describe, expect, it, vi } from "vitest";
import type { Announcement } from "@/types";

vi.mock("next/navigation", () => ({
  usePathname: () => "/queries",
}));

vi.mock("@/hooks/use-homepage", () => ({
  useHomepage: () => ({
    data: {
      announcements: [
        {
          id: 1,
          title: "Test Announcement",
          is_active: true,
          order_ind: 1,
        },
      ],
    },
  }),
}));

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
  GRADIENT_STYLES,
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

  it.concurrent("TopAnnouncementBanner returns null when on /queries route", () => {
    // If pathname is /queries or no announcements, TopAnnouncementBanner returns null
    const result = TopAnnouncementBanner();
    expect(result).toBeNull();
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
      expect(getBannerMediaUrl("1a", "d", "webp")).toMatch(
        /\/bnr\/46\/desktop_webp\?v2$/,
      );
      expect(getBannerMediaUrl("bnr-1a", "m", "avif")).toMatch(
        /\/bnr\/46\/mobile_avif\?v2$/,
      );
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

      // Verify data-announcement-section attribute and style element for responsive heights
      expect(tree?.props["data-announcement-section"]).toBeDefined();
      const styleChild = tree?.props.children[0];
      expect(styleChild.type).toBe("style");
      expect(styleChild.props.children).toContain(
        "[data-announcement-section]",
      );

      // Verify live region exists in tree
      const liveRegion = tree?.props.children[1];
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

    it.concurrent("handles gradient overlay accurately for none, black_vignette and presets", () => {
      const baseItem = mockAnnouncements[0];
      if (!baseItem) throw new Error("Missing mock announcement");

      // Case 1: none -> No overlay
      const noneSlide = BannerSlide({
        item: { ...baseItem, bg_gradient: "none" },
        index: 0,
        total: 1,
        isActive: true,
        isAdjacent: false,
        prefersReducedMotion: false,
      });
      // The second child of BannerSlide is the overlay
      expect(noneSlide.props.children[1]).toBeNull();

      // Case 2: null -> No overlay
      const nullSlide = BannerSlide({
        item: { ...baseItem, bg_gradient: null },
        index: 0,
        total: 1,
        isActive: true,
        isAdjacent: false,
        prefersReducedMotion: false,
      });
      expect(nullSlide.props.children[1]).toBeNull();

      // Case 3: black_vignette -> Black gradient overlay
      const vignetteSlide = BannerSlide({
        item: { ...baseItem, bg_gradient: "black_vignette" },
        index: 0,
        total: 1,
        isActive: true,
        isAdjacent: false,
        prefersReducedMotion: false,
      });
      expect(vignetteSlide.props.children[1]).not.toBeNull();
      expect(vignetteSlide.props.children[1]?.props.style.background).toContain(
        "linear-gradient(to right, rgba(0,0,0,0.85)",
      );

      // Case 4: Preset gradient
      const presetSlide = BannerSlide({
        item: {
          ...baseItem,
          bg_gradient: "from-amber-600/90 via-orange-600/80 to-amber-700/90",
        },
        index: 0,
        total: 1,
        isActive: true,
        isAdjacent: false,
        prefersReducedMotion: false,
      });
      expect(presetSlide.props.children[1]).not.toBeNull();
      expect(presetSlide.props.children[1]?.props.style.background).toBe(
        GRADIENT_STYLES["from-amber-600/90 via-orange-600/80 to-amber-700/90"],
      );
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
