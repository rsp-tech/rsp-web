import type { Properties } from "posthog-js";

export interface ContentProperties {
  slug: string;
  title: string;
  category: string;
  tags: string[];
}

let isInitialized = false;

// biome-ignore lint/suspicious/noExplicitAny: Type definitions are dynamic
const initPostHog = (ph: any) => {
  if (isInitialized) return;

  const key = process.env["NEXT_PUBLIC_POSTHOG_KEY"];
  const host = process.env["NEXT_PUBLIC_POSTHOG_HOST"];

  if (key) {
    ph.init(key, {
      api_host: host,
      person_profiles: "identified_only",
      capture_pageview: false, // Captured manually by the tracker component
      capture_pageleave: true,
      autocapture: false,
      disable_session_recording: true,
      disable_surveys: true,
      capture_performance: false,
    });
    isInitialized = true;
  }
};

/**
 * Tracks a custom analytics event to PostHog.
 * Assures safe invocation by verifying environment is client-side and configuration keys exist.
 */

export const trackEvent = <T extends Properties>(
  name: string,
  props?: T,
): Promise<void> | void => {
  if (typeof window === "undefined") {
    return;
  }

  if (!process.env["NEXT_PUBLIC_POSTHOG_KEY"]) {
    return;
  }

  return import("posthog-js")
    .then(({ default: posthog }) => {
      initPostHog(posthog);
      posthog.capture(name, props);
    })
    .catch((err) => {
      console.error("Failed to capture analytics event:", err);
    });
};
