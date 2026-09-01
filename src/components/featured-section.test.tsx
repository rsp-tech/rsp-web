import { describe, expect, it } from "vitest";
import { FeaturedSection } from "./featured-section";

describe.concurrent("src/components/featured-section.tsx suite", () => {
  it.concurrent("exports FeaturedSection component", () => {
    expect(typeof FeaturedSection).toBe("function");
  });
});
