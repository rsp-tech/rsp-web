import { describe, expect, it } from "vitest";

describe.concurrent("src/hooks/use-notification-subscription.ts suite", () => {
  it.concurrent("loads use-notification-subscription module without crashing", async () => {
    const mod = await import("./use-notification-subscription");
    expect(mod).toBeDefined();
  });
});
