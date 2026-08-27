"use client";

import { type HTMLProps, useEffect, useRef } from "react";
import { type ContentProperties, trackEvent } from "@/lib/analytics";
import { cn } from "@/lib/utils";

interface ArticleTrackerProps extends HTMLProps<HTMLDivElement> {
  contentProps: ContentProperties;
}

/**
 * ArticleTracker utilizes the browser's native IntersectionObserver to fire
 * the 'article_completed' analytics event when the user reaches the end of the text.
 */
export function ArticleTracker({
  contentProps,
  className,
  ...props
}: ArticleTrackerProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const hasTracked = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset when article changes
  useEffect(() => {
    hasTracked.current = false;
  }, [contentProps.slug]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && !hasTracked.current) {
          hasTracked.current = true;
          trackEvent("article_completed", contentProps);
        }
      },
      {
        root: null, // viewport
        rootMargin: "0px",
        threshold: 1.0, // trigger when the sentinel is fully in view
      },
    );

    observer.observe(sentinel);

    return () => {
      observer.unobserve(sentinel);
    };
  }, [contentProps]);

  return (
    <div
      ref={sentinelRef}
      className={cn("h-3 w-full mt-2", className)}
      aria-hidden="true"
      {...props}
    />
  );
}
