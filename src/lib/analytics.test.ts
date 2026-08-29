import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import posthog from "posthog-js";
import { trackEvent } from "./analytics";

// Mock posthog-js
vi.mock("posthog-js", () => {
  return {
    default: {
      capture: vi.fn(),
      init: vi.fn(),
    },
  };
});

describe.concurrent("analytics utility", () => {
  it.concurrent("should not fire events if NEXT_PUBLIC_POSTHOG_KEY is missing", () => {
    delete process.env["NEXT_PUBLIC_POSTHOG_KEY"];
    trackEvent("test_event", { foo: "bar" });
    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it.concurrent("should fire events if NEXT_PUBLIC_POSTHOG_KEY is present", async () => {
    process.env["NEXT_PUBLIC_POSTHOG_KEY"] = "phc_test_key";
    process.env["NEXT_PUBLIC_POSTHOG_HOST"] = "https://app.posthog.com";

    await trackEvent("test_event", { foo: "bar" });

    expect(posthog.capture).toHaveBeenCalledWith("test_event", { foo: "bar" });
  });
});



