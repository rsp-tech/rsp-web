import { describe, expect, it } from "vitest";
import robots from "./robots";

describe.concurrent("app/robots suite", () => {
  it.concurrent("returns robots configuration object", () => {
    const config = robots();
    expect(config.sitemap).toContain("sitemap.xml");
    expect(Array.isArray(config.rules)).toBe(true);

    const rules = config.rules as Array<{
      userAgent?: string | string[];
      allow?: string | string[];
      disallow?: string | string[];
    }>;

    const blockedRule = rules.find((r) => r.disallow === "/");
    expect(blockedRule).toBeDefined();
    expect(blockedRule?.userAgent).toContain("SemrushBot");
    expect(blockedRule?.userAgent).toContain("PetalBot");
    expect(blockedRule?.userAgent).toContain("Bytespider");

    const seoRule = rules.find(
      (r) =>
        Array.isArray(r.userAgent) &&
        r.userAgent.includes("Googlebot") &&
        r.allow === "/",
    );
    expect(seoRule).toBeDefined();
    expect(seoRule?.userAgent).toContain("GPTBot");
    expect(seoRule?.userAgent).toContain("bingbot");
  });
});
