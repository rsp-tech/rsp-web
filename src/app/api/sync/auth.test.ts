import { describe, expect, it } from "vitest";

describe.concurrent("api/sync/auth suite", () => {
  it.concurrent("rejects requests without Bearer token", async () => {
    const { getAuthenticatedRoleId } = await import("./auth");
    const req = new Request("https://localhost/api/sync/role", {
      headers: {},
    });

    const res = await getAuthenticatedRoleId(req as any);
    expect(res.errorResponse).toBeDefined();
    expect(res.errorResponse?.status).toBe(401);
  });
});
