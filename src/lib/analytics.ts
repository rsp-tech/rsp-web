import posthog from "posthog-js";

export interface ContentProperties {
  slug: string;
  title: string;
  category: string;
  tags: string[];
}

/**
 * Tracks a custom analytics event to PostHog.
 * Assures safe invocation by verifying environment is client-side and configuration keys exist.
 */

// biome-ignore lint/suspicious/noExplicitAny: ok for now
export const trackEvent = (name: string, props?: Record<string, any>) => {
  if (typeof window === "undefined") {
    return;
  }

  if (!process.env["NEXT_PUBLIC_POSTHOG_KEY"]) {
    return;
  }

  try {
    posthog.capture(name, props);
  } catch (err) {
    console.error("Failed to capture analytics event:", err);
  }
};
