import posthog from "posthog-js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

describe("analytics utility", () => {
  const originalEnv = process.env;
  const originalWindow = global.window;

  beforeEach(() => {
    vi.resetAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
    global.window = originalWindow;
  });

  it("should not fire events if executed server-side (window is undefined)", () => {
    // Simulate server-side: window is undefined
    // @ts-expect-error
    delete global.window;
    process.env["NEXT_PUBLIC_POSTHOG_KEY"] = "phc_test_key";

    trackEvent("test_event", { foo: "bar" });

    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("should not fire events if NEXT_PUBLIC_POSTHOG_KEY is missing", () => {
    // biome-ignore lint/suspicious/noExplicitAny: Simulate client-side: window is defined
    global.window = {} as any;
    delete process.env["NEXT_PUBLIC_POSTHOG_KEY"];

    trackEvent("test_event", { foo: "bar" });

    expect(posthog.capture).not.toHaveBeenCalled();
  });

  it("should fire events if client-side and NEXT_PUBLIC_POSTHOG_KEY is present", async () => {
    // biome-ignore lint/suspicious/noExplicitAny: Simulate client-side: window is defined
    global.window = {} as any;
    process.env["NEXT_PUBLIC_POSTHOG_KEY"] = "phc_test_key";

    await trackEvent("test_event", { foo: "bar" });

    expect(posthog.capture).toHaveBeenCalledWith("test_event", { foo: "bar" });
  });
});
