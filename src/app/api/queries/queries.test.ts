import { describe, expect, it } from "vitest";

describe.concurrent("api/queries route suite", () => {
  it.concurrent("POST handler checks required fields", async () => {
    const { POST } = await import("./route");
    expect(typeof POST).toBe("function");

    const req = new Request("https://localhost/api/queries", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(400);
  });

  it.concurrent("PATCH handler validates query_id and status", async () => {
    const { PATCH } = await import("./route");
    expect(typeof PATCH).toBe("function");

    // Missing fields
    const req1 = new Request("https://localhost/api/queries", {
      method: "PATCH",
      body: JSON.stringify({}),
    });
    const res1 = await PATCH(req1 as any);
    expect(res1.status).toBe(400);

    // Invalid status
    const req2 = new Request("https://localhost/api/queries", {
      method: "PATCH",
      body: JSON.stringify({ query_id: "q-123", status: "invalid_status" }),
    });
    const res2 = await PATCH(req2 as any);
    expect(res2.status).toBe(400);
  });
});
