import { describe, expect, it } from "vitest";
import { useIsMobile } from "./use-is-mobile";

describe.concurrent("use-is-mobile suite", () => {
  it.concurrent("exports useIsMobile", () => {
    expect(typeof useIsMobile).toBe("function");
  });
});
