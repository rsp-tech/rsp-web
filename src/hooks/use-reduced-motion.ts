"use client";

import { useSyncExternalStore } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

const subscribe = (callback: () => void) => {
  if (typeof window === "undefined" || !window.matchMedia) {
    return () => {};
  }
  const mediaQuery = window.matchMedia(QUERY);
  if (typeof mediaQuery.addEventListener === "function") {
    mediaQuery.addEventListener("change", callback);
    return () => mediaQuery.removeEventListener("change", callback);
  }
  // Fallback for older browsers
  mediaQuery.addListener(callback);
  return () => mediaQuery.removeListener(callback);
};

const getSnapshot = (): boolean => {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia(QUERY).matches;
};

const getServerSnapshot = (): boolean => false;

/**
 * Hook to detect whether the user has requested the system minimize the amount of animation or motion.
 * Uses useSyncExternalStore for concurrent safety, SSR consistency, and zero re-render overhead.
 */
export const useReducedMotion = (): boolean =>
  useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
