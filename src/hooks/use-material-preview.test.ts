import { describe, expect, it } from "vitest";
import { useMaterialPreview } from "./use-material-preview";

describe.concurrent("use-material-preview suite", () => {
  it.concurrent("exports useMaterialPreview", () => {
    expect(typeof useMaterialPreview).toBe("function");
  });
});
