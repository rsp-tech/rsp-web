import { describe, expect, it, vi } from "vitest";

vi.mock("./auth", () => ({
  verifyRevalidateAuth: () => Promise.resolve(null),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe.concurrent("api/revalidate/route suite", () => {
  it.concurrent("POST revalidates tag successfully", async () => {
    const { POST } = await import("./route");
    const req = new Request("https://localhost/api/revalidate", {
      method: "POST",
      body: JSON.stringify({ tag: "sync-meta" }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
  });

  it.concurrent("POST revalidates feature-flags tag", async () => {
    const { POST } = await import("./route");
    const req = new Request("https://localhost/api/revalidate", {
      method: "POST",
      body: JSON.stringify({ tag: "feature-flags" }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.revalidated).toContain("tag:feature-flags");
  });

  it.concurrent("POST revalidates queries path and live diff cache", async () => {
    const { POST } = await import("./route");
    const req = new Request("https://localhost/api/revalidate", {
      method: "POST",
      body: JSON.stringify({
        paths: ["/queries"],
        tags: ["sync-meta", "sync-live-diff"],
      }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.revalidated).toContain("/queries");
    expect(json.revalidated).not.toContain("/library/queries");
    expect(json.revalidated).not.toContain("tag:category:queries");
    expect(json.revalidated).toContain("tag:sync-live-diff");
    expect(json.revalidated).toContain("/api/sync/user");
  });
});
