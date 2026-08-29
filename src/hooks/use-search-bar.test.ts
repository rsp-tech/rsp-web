import { describe, expect, it } from "vitest";
import { useSearchBar } from "./use-search-bar";

describe.concurrent("use-search-bar suite", () => {
  it.concurrent("exports useSearchBar", () => {
    expect(typeof useSearchBar).toBe("function");
  });
});
