import { describe, expect, it } from "vitest";
import { useNotificationSubscription } from "./use-notification-subscription";

describe.concurrent("use-notification-subscription suite", () => {
  it.concurrent("exports useNotificationSubscription", () => {
    expect(typeof useNotificationSubscription).toBe("function");
  });
});
