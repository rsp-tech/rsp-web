import { describe, expect, it } from "vitest";
import { useOnlineStatus } from "./use-online-status";

describe.concurrent("use-online-status suite", () => {
  it.concurrent("exports useOnlineStatus", () => {
    expect(typeof useOnlineStatus).toBe("function");
  });
});
