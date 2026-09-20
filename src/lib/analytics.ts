export type EventProperties = Record<string, unknown>;

export interface ContentProperties {
  slug: string;
  title: string;
  category: string;
  tags: string[];
  [key: string]: unknown;
}

const getDistinctId = (): string => {
  const KEY = "ph_distinct_id";
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id =
        typeof crypto !== "undefined"
          ? crypto.randomUUID()
          : `ph_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
};

const isTrackingAllowed = (): boolean => {
  if (typeof window === "undefined") return false;

  const key = process.env["NEXT_PUBLIC_POSTHOG_KEY"];
  if (!key) return false;

  // Filter out development environments and localhost
  if (
    process.env["NODE_ENV"] !== "production" ||
    window.location.hostname === "localhost" ||
    window.location.hostname === "127.0.0.1"
  ) {
    return false;
  }

  // Allow manual opt-out during testing or internal usage
  try {
    if (localStorage.getItem("disable_analytics") === "true") {
      return false;
    }
  } catch {
    // Ignore storage access errors
  }

  return true;
};

/**
 * Tracks a custom analytics event to PostHog via direct HTTP capture API.
 * Avoids downloading or bundling heavy third-party tracking scripts.
 */
export const trackEvent = async <T extends object>(
  name: string,
  props?: T,
): Promise<void> => {
  if (!isTrackingAllowed()) {
    return;
  }

  const key = process.env["NEXT_PUBLIC_POSTHOG_KEY"];
  const host =
    process.env["NEXT_PUBLIC_POSTHOG_HOST"] || "https://us.i.posthog.com";

  try {
    const payload = {
      api_key: key,
      event: name,
      properties: {
        distinct_id: getDistinctId(),
        $current_url: window.location.href,
        ...props,
      },
      timestamp: new Date().toISOString(),
    };

    const endpoint = `${host.replace(/\/+$/, "")}/capture/`;

    await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Silently ignore network and telemetry transport errors
  }
};
