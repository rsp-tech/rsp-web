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
});
