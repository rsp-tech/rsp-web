"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export const PageViewsTracker = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // 1. Track page views programmatically when route updates
  useEffect(() => {
    if (pathname && typeof window !== "undefined") {
      let url = window.location.origin + pathname;
      if (searchParams?.toString()) {
        url = `${url}?${searchParams.toString()}`;
      }
      setTimeout(() => {
        trackEvent("$pageview", { $current_url: url });
      }, 1500);
    }
  }, [pathname, searchParams]);

  // 2. Track outbound/external link clicks globally
  useEffect(() => {
    const handleExternalLink = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href) return;

      // Skip non-HTTP links (hash links, mailto, tel, relative links)
      if (
        href.startsWith("#") ||
        href.startsWith("/") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      try {
        const url = new URL(href, window.location.origin);
        // Verify it is indeed outbound
        if (url.origin !== window.location.origin) {
          trackEvent("external_link_clicked", { target_url: href });
        }
      } catch {
        // Ignore URL parsing errors
      }
    };

    window.addEventListener("click", handleExternalLink);
    return () => window.removeEventListener("click", handleExternalLink);
  }, []);

  return null;
};
