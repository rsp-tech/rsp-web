"use client";

import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useHomepage } from "@/hooks/use-homepage";
import type { Announcement } from "@/types";

interface AnnouncementBannerProps {
  announcements: Announcement[];
}

export const getBannerMediaUrl = (
  mediaPath: string,
  variant: "d" | "m",
  ext: "webp" | "avif",
): string => {
  if (mediaPath.startsWith("http")) return mediaPath;
  const cleanPath = mediaPath.startsWith("bnr-")
    ? mediaPath
    : `bnr-${mediaPath}`;
  return `/img/${cleanPath}-${variant}.${ext}`;
};

export const getBannerRawMediaUrl = (mediaPath: string): string => {
  if (mediaPath.startsWith("http")) return mediaPath;
  const cleanPath = mediaPath.startsWith("bnr-")
    ? mediaPath
    : `bnr-${mediaPath}`;
  return `/img/${cleanPath}`;
};

export const AnnouncementBanner = ({
  announcements,
}: AnnouncementBannerProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem("rsp_banner_dismissed") === "true";
    } catch {
      return false;
    }
  });

  const total = announcements.length;

  useEffect(() => {
    if (total <= 1 || isPaused || isDismissed) return;

    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (prefersReducedMotion) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, 6000);

    return () => clearInterval(interval);
  }, [total, isPaused, isDismissed]);

  if (isDismissed || !announcements || total === 0) {
    return null;
  }

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      window.sessionStorage.setItem("rsp_banner_dismissed", "true");
    } catch {
      // Ignore storage errors
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    setTouchStartX(e.touches[0]?.clientX ?? null);
    setTouchStartY(e.touches[0]?.clientY ?? null);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartX === null || touchStartY === null) return;

    const endX = e.changedTouches[0]?.clientX ?? touchStartX;
    const endY = e.changedTouches[0]?.clientY ?? touchStartY;
    const deltaX = endX - touchStartX;
    const deltaY = endY - touchStartY;

    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  return (
    <section
      aria-label="Announcements & Highlights"
      className="relative w-full overflow-hidden border-b border-border group transition-all"
      style={{ minHeight: "56px" }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Sliding Carousel Track */}
      <div
        className="flex w-full transition-all"
        style={{
          transform: `translateX(-${currentIndex * 100}%)`,
          transitionDuration: "500ms",
        }}
      >
        {announcements.map((item) => {
          const gradient = item.bg_gradient;
          const isNoOverlay = !gradient || gradient === "none";

          return (
            <div
              key={item.id}
              className="relative w-full shrink-0 flex items-center justify-between px-4 py-2 pr-10 overflow-hidden"
              style={{ minHeight: "56px" }}
            >
              {/* Background Media */}
              {item.media_path && (
                <div className="absolute inset-0 w-full h-full bg-muted">
                  {item.media_type === "video" ? (
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                      src={getBannerRawMediaUrl(item.media_path)}
                    />
                  ) : item.media_type === "gif" ? (
                    <img
                      src={getBannerRawMediaUrl(item.media_path)}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <picture>
                      <source
                        media="(max-width: 640px)"
                        srcSet={getBannerMediaUrl(item.media_path, "m", "avif")}
                        type="image/avif"
                      />
                      <source
                        media="(max-width: 640px)"
                        srcSet={getBannerMediaUrl(item.media_path, "m", "webp")}
                        type="image/webp"
                      />
                      <source
                        srcSet={getBannerMediaUrl(item.media_path, "d", "avif")}
                        type="image/avif"
                      />
                      <img
                        src={getBannerMediaUrl(item.media_path, "d", "webp")}
                        alt=""
                        className="absolute inset-0 w-full h-full object-cover"
                      />
                    </picture>
                  )}
                </div>
              )}

              {/* Color Gradient Overlay */}
              <div
                className="absolute inset-0"
                style={{
                  background: isNoOverlay
                    ? "linear-gradient(to right, rgba(0,0,0,0.85), rgba(0,0,0,0.5), rgba(0,0,0,0.2))"
                    : gradient || undefined,
                  opacity: isNoOverlay ? 1 : 0.9,
                  transitionDuration: "500ms",
                }}
              />

              {/* Shimmer Light Sweep Effect */}
              <div className="absolute inset-0 animate-shimmer pointer-events-none" />

              {/* Slide Content */}
              <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 text-white">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full backdrop-blur-xs"
                    style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
                  >
                    <Sparkles className="h-3 w-3 text-primary" />
                    {item.badge_text ||
                      item.category?.replace("_", " ") ||
                      "Notice"}
                  </span>
                  <span className="text-xs sm:text-sm font-bold font-heading tracking-tight truncate">
                    {item.title}
                  </span>
                  {item.subtitle && (
                    <span
                      className="text-xs truncate"
                      style={{ color: "rgba(255,255,255,0.85)" }}
                    >
                      • {item.subtitle}
                    </span>
                  )}
                </div>

                {item.cta_label && (
                  <div className="shrink-0">
                    <Button
                      asChild
                      size="sm"
                      className="font-semibold text-xs px-3 py-1 transition-all hover:opacity-95 cursor-pointer"
                      style={{ backgroundColor: "#ffffff", color: "#18181b" }}
                    >
                      <Link href={item.cta_url || "#"}>
                        <span>{item.cta_label}</span>
                      </Link>
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Multi-banner Navigation Chevrons */}
      {total > 1 && (
        <>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-white cursor-pointer"
              style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
              onClick={handlePrev}
              aria-label="Previous announcement"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <div
            className="absolute top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100"
            style={{ right: "2.25rem" }}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-white cursor-pointer"
              style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
              onClick={handleNext}
              aria-label="Next announcement"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Dots Indicator */}
          <div
            className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center gap-1"
            style={{ bottom: "0.25rem" }}
          >
            {announcements.map((item, idx) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className="rounded-full transition-all cursor-pointer"
                style={{
                  height: "0.25rem",
                  width: idx === currentIndex ? "1rem" : "0.25rem",
                  backgroundColor:
                    idx === currentIndex ? "#ffffff" : "rgba(255,255,255,0.4)",
                  transitionDuration: "300ms",
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Close Button for Session Dismissal */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full text-white cursor-pointer"
          style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
          onClick={handleDismiss}
          aria-label="Dismiss banner for session"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </section>
  );
};

export const TopAnnouncementBanner = () => {
  const { data: homepageData } = useHomepage();

  if (!homepageData?.announcements || homepageData.announcements.length === 0) {
    return null;
  }

  return <AnnouncementBanner announcements={homepageData.announcements} />;
};
