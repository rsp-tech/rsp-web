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
});
