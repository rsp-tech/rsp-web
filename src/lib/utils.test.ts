import { describe, expect, it } from "vitest";
import { pathToUrlPath } from "./utils";

describe("pathToUrlPath", () => {
  it("converts a single segment path string", () => {
    expect(pathToUrlPath("/spiritual-discourses")).toBe("spiritual_discourses");
  });

  it("converts a multi-segment path string", () => {
    expect(pathToUrlPath("/spiritual-discourses/bg")).toBe(
      "spiritual_discourses.bg",
    );
  });

  it("handles string arrays (slugs) correctly", () => {
    expect(pathToUrlPath(["spiritual-discourses", "bg"])).toBe(
      "spiritual_discourses.bg",
    );
  });

  it("normalizes leading/trailing and duplicate slashes", () => {
    expect(pathToUrlPath("///spiritual-discourses//bg/")).toBe(
      "spiritual_discourses.bg",
    );
  });

  it("handles empty path string or empty array gracefully", () => {
    expect(pathToUrlPath("")).toBe("");
    expect(pathToUrlPath("/")).toBe("");
    expect(pathToUrlPath([])).toBe("");
  });

  it("replaces multiple hyphens with underscores", () => {
    expect(pathToUrlPath("/some-very-long-path-name/sub-cat")).toBe(
      "some_very_long_path_name.sub_cat",
    );
  });
});
