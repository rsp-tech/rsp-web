import { describe, expect, it } from "vitest";
import robots from "./robots";

describe.concurrent("app/robots suite", () => {
  it.concurrent("returns robots configuration object", () => {
    const config = robots();
    expect(config.sitemap).toContain("sitemap.xml");
    expect(Array.isArray(config.rules)).toBe(true);
  });
});

