import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { trackEvent } from "./analytics";

describe("analytics utility", () => {
  const originalEnv = process.env;
  let fetchMock: any;

  beforeEach(() => {
    process.env = { ...originalEnv };
    fetchMock = vi.fn().mockResolvedValue({ ok: true });
    globalThis.fetch = fetchMock;
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  it("should not fire events if NEXT_PUBLIC_POSTHOG_KEY is missing", async () => {
    delete process.env["NEXT_PUBLIC_POSTHOG_KEY"];
    vi.stubEnv("NODE_ENV", "production");
    await trackEvent("test_event", { foo: "bar" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should not fire events if hostname is localhost", async () => {
    process.env["NEXT_PUBLIC_POSTHOG_KEY"] = "phc_test_key";
    vi.stubEnv("NODE_ENV", "production");
    // window.location in happy-dom
    window.location.hostname = "localhost";

    await trackEvent("test_event", { foo: "bar" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should not fire events if disable_analytics is set in localStorage", async () => {
    process.env["NEXT_PUBLIC_POSTHOG_KEY"] = "phc_test_key";
    vi.stubEnv("NODE_ENV", "production");
    window.location.hostname = "radheshyamdas.com";
    localStorage.setItem("disable_analytics", "true");

    await trackEvent("test_event", { foo: "bar" });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("should fire fetch if NEXT_PUBLIC_POSTHOG_KEY is present in production", async () => {
    process.env["NEXT_PUBLIC_POSTHOG_KEY"] = "phc_test_key";
    process.env["NEXT_PUBLIC_POSTHOG_HOST"] = "https://app.posthog.com";
    vi.stubEnv("NODE_ENV", "production");
    window.location.hostname = "radheshyamdas.com";

    await trackEvent("test_event", { foo: "bar" });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, options] = fetchMock.mock.calls[0];
    expect(url).toBe("https://app.posthog.com/capture/");
    expect(options.method).toBe("POST");
    expect(options.keepalive).toBe(true);

    const body = JSON.parse(options.body);
    expect(body.api_key).toBe("phc_test_key");
    expect(body.event).toBe("test_event");
    expect(body.properties.foo).toBe("bar");
    expect(body.properties.distinct_id).toBeDefined();
    expect(body.properties.$current_url).toBeDefined();
  });
});
