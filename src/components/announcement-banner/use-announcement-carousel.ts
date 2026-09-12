import { useEffect, useState } from "react";
import { useReducedMotion } from "@/hooks/use-reduced-motion";

const DISMISSED_STORAGE_KEY = "rsp_banner_dismissed";
const SWIPE_THRESHOLD_PX = 40;
const ROTATION_INTERVAL_MS = 6000;

interface UseAnnouncementCarouselOptions {
  total: number;
}

export const useAnnouncementCarousel = ({
  total,
}: UseAnnouncementCarouselOptions) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const prefersReducedMotion = useReducedMotion();

  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return window.sessionStorage.getItem(DISMISSED_STORAGE_KEY) === "true";
    } catch {
      return false;
    }
  });

  const handlePrev = () => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev - 1 + total) % total);
  };

  const handleNext = () => {
    if (total <= 1) return;
    setCurrentIndex((prev) => (prev + 1) % total);
  };

  const handleSelect = (index: number) => {
    if (index >= 0 && index < total) {
      setCurrentIndex(index);
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      window.sessionStorage.setItem(DISMISSED_STORAGE_KEY, "true");
    } catch {
      // Ignore storage errors
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsPaused(true);
    const touch = e.touches[0];
    setTouchStartX(touch?.clientX ?? null);
    setTouchStartY(touch?.clientY ?? null);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    setIsPaused(false);
    if (touchStartX === null || touchStartY === null) return;

    const endTouch = e.changedTouches[0];
    const endX = endTouch?.clientX ?? touchStartX;
    const endY = endTouch?.clientY ?? touchStartY;
    const deltaX = endX - touchStartX;
    const deltaY = endY - touchStartY;

    if (
      Math.abs(deltaX) > SWIPE_THRESHOLD_PX &&
      Math.abs(deltaX) > Math.abs(deltaY)
    ) {
      if (deltaX < 0) {
        handleNext();
      } else {
        handlePrev();
      }
    }

    setTouchStartX(null);
    setTouchStartY(null);
  };

  // Review Item 1 Fix: Reset pause state and touch tracking if touch sequence is interrupted
  const handleTouchCancel = () => {
    setIsPaused(false);
    setTouchStartX(null);
    setTouchStartY(null);
  };

  const handleMouseEnter = () => setIsPaused(true);
  const handleMouseLeave = () => setIsPaused(false);

  // Auto-advancing rotation timer
  useEffect(() => {
    if (total <= 1 || isPaused || isDismissed || prefersReducedMotion) {
      return;
    }

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % total);
    }, ROTATION_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [total, isPaused, isDismissed, prefersReducedMotion]);

  return {
    currentIndex,
    isPaused,
    isDismissed,
    prefersReducedMotion,
    handlePrev,
    handleNext,
    handleSelect,
    handleDismiss,
    handleMouseEnter,
    handleMouseLeave,
    handleTouchStart,
    handleTouchEnd,
    handleTouchCancel,
  };
};
