import { describe, expect, it } from "vitest";
import { ArticleTracker } from "./article-tracker";

describe.concurrent("analytics components suite", () => {
  it.concurrent("exports ArticleTracker component", () => {
    expect(typeof ArticleTracker).toBe("function");
  });
});
