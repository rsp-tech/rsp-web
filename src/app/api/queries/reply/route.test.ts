import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServerClient: () => ({
    from: () => ({
      insert: () => ({
        select: () => ({
          single: () =>
            Promise.resolve({
              data: { id: "rep_1", message: "Answer" },
              error: null,
            }),
        }),
      }),
      update: () => ({
        eq: () => Promise.resolve({ error: null }),
      }),
    }),
  }),
}));

describe.concurrent("api/queries/reply/route suite", () => {
  it.concurrent("POST inserts reply for authorized admin", async () => {
    const { POST } = await import("./route");
    const req = new Request("https://localhost/api/queries/reply", {
      method: "POST",
      body: JSON.stringify({
        query_id: "q_1",
        message: "Hare Krishna! Here is your answer.",
      }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);
  });
});
