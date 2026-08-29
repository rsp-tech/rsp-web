import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServerClient: () => ({
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: { id: "q1", subject: "Questions" },
              error: null,
            }),
        }),
      }),
    }),
  }),
  handleMutationResult: <T>(data: T, error: { message?: string } | null) => {
    if (error) {
      return Response.json(
        { error: error.message || "Database insert failed" },
        { status: 500 },
      );
    }
    return Response.json({ success: true, data });
  },
}));

describe.concurrent("app/api/queries/route suite", () => {
  it.concurrent("POST returns 400 when required fields are missing", async () => {
    const { POST } = await import("./route");
    const req = new Request("https://localhost/api/queries", {
      method: "POST",
      body: JSON.stringify({}),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it.concurrent("POST inserts query and returns 200 with result data", async () => {
    const { POST } = await import("./route");
    const req = new Request("https://localhost/api/queries", {
      method: "POST",
      body: JSON.stringify({
        category: "general",
        subject: "Spiritual Question",
        message: "How to develop dedication?",
      }),
    });
    const res = await POST(req as any);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.id).toBe("q1");
  });
});
