import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServerClient: () => ({
    storage: {
      from: () => ({
        download: (filename: string) =>
          Promise.resolve({
            data: new Blob(["img_bytes"], { type: "image/webp" }),
            error: null,
          }),
      }),
    },
  }),
}));

describe.concurrent("app/api/img/[...path]/route suite", () => {
  it.concurrent("GET downloads and proxies image files", async () => {
    const { GET } = await import("./route");
    const req = new Request("https://localhost/api/img/cover.webp");
    const res = await GET(req as any, {
      params: Promise.resolve({ path: ["cover.webp"] }),
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toBe("image/webp");
  });
});

