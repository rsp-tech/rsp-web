import { describe, expect, it, vi } from "vitest";

vi.mock("@/app/api/revalidate/auth", () => ({
  verifyRevalidateAuth: (req: Request) => {
    const auth = req.headers.get("authorization");
    if (!auth?.startsWith("Bearer valid_token")) {
      return Promise.resolve(
        new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        }),
      );
    }
    return Promise.resolve(null);
  },
}));

describe.concurrent("api/revalidate suite", () => {
  it.concurrent("POST handler validates backup authorization token", async () => {
    const { POST } = await import("./backup/route");
    const req = new Request("https://localhost/api/revalidate/backup", {
      method: "POST",
      headers: {
        authorization: "Bearer invalid_token",
      },
    });

    const res = await POST(req as any);
    expect(res.status).toBe(401);
  });
});
