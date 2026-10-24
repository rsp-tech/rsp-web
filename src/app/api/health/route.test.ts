import { describe, expect, it } from "vitest";
import { GET, HEAD } from "./route";

describe("health API route", () => {
  it("should return healthy status on GET with static cache headers", async () => {
    const response = GET();
    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data).toEqual({
      status: "healthy",
      service: "rsp-web",
    });

    const cacheControl = response.headers.get("Cache-Control");
    expect(cacheControl).toContain("public");
    expect(cacheControl).toContain("max-age=60");
  });

  it("should return 200 with empty body on HEAD", () => {
    const response = HEAD();
    expect(response.status).toBe(200);

    const cacheControl = response.headers.get("Cache-Control");
    expect(cacheControl).toContain("public");
    expect(cacheControl).toContain("max-age=60");
  });
});
