import { describe, expect, it, vi } from "vitest";

vi.mock("../auth", () => ({
  verifyRevalidateAuth: () => Promise.resolve(null),
}));

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}));

describe.concurrent("app/api/revalidate/backup/route suite", () => {
  it.concurrent("POST flushes backup caches and returns 200", async () => {
    const { POST } = await import("./route");
    const req = new Request("https://localhost/api/revalidate/backup", {
      method: "POST",
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
  });
});

