"use client";

import { usePathname, useSearchParams } from "next/navigation";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { Suspense, useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

/**
 * Automatically captures SPA page transitions using usePathname and useSearchParams.
 */
function PostHogPageView() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (pathname && typeof window !== "undefined") {
      let url = window.origin + pathname;
      if (searchParams?.toString()) {
        url = `${url}?${searchParams.toString()}`;
      }
      posthog.capture("$pageview", {
        $current_url: url,
      });
    }
  }, [pathname, searchParams]);

  // Global listener for outbound/external link clicks
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
        // Ignore URL parsing errors for relative/special paths
      }
    };

    window.addEventListener("click", handleExternalLink);
    return () => window.removeEventListener("click", handleExternalLink);
  }, []);

  return null;
}

interface PHProviderProps {
  children: React.ReactNode;
}

export function PHProvider({ children }: PHProviderProps) {
  useEffect(() => {
    const key = process.env["NEXT_PUBLIC_POSTHOG_KEY"];
    const host =
      process.env["NEXT_PUBLIC_POSTHOG_HOST"] || "https://us.i.posthog.com";

    if (key && typeof window !== "undefined") {
      posthog.init(key, {
        api_host: host,
        person_profiles: "identified_only",
        capture_pageview: false, // Pageview captured manually above to handle SPA routing correctly
        capture_pageleave: true,
        autocapture: false,
        disable_session_recording: true,
        disable_surveys: true,
        capture_performance: false,
      });
    }
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <Suspense fallback={null}>
        <PostHogPageView />
      </Suspense>
      {children}
    </PostHogProvider>
  );
}
