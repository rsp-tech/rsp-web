import { describe, expect, it } from "vitest";
import { useVideo } from "./use-video";

describe.concurrent("use-video suite", () => {
  it.concurrent("exports useVideo hook function", () => {
    expect(typeof useVideo).toBe("function");
  });
});
