import { describe, expect, it } from "vitest";
import { useEvents, useLanguages, useSpeakers } from "./use-metadata";

describe.concurrent("use-metadata suite", () => {
  it.concurrent("exports metadata hooks", () => {
    expect(typeof useEvents).toBe("function");
    expect(typeof useSpeakers).toBe("function");
    expect(typeof useLanguages).toBe("function");
  });
});
