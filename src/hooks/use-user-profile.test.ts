import { describe, expect, it } from "vitest";
import { useUserProfile } from "./use-user-profile";

describe.concurrent("use-user-profile hook suite", () => {
  it.concurrent("exports valid useUserProfile hook", () => {
    expect(typeof useUserProfile).toBe("function");
  });
});
