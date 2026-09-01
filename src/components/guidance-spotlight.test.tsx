import { describe, expect, it } from "vitest";
import { GuidanceSpotlight } from "./guidance-spotlight";

describe.concurrent("src/components/guidance-spotlight.tsx suite", () => {
  it.concurrent("exports GuidanceSpotlight component", () => {
    expect(typeof GuidanceSpotlight).toBe("function");
  });
});
