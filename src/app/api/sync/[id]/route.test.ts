import { describe, expect, it, vi } from "vitest";

process.env["SYNC_RESOURCE"] = "sync.zip";

vi.mock("../auth", () => ({
  getAuthenticatedRoleId: () =>
    Promise.resolve({
      roleId: 2,
    }),
}));

vi.mock("../utils", () => ({
  fetchBackupAsset: () => Promise.resolve(new Response("ZIP_CONTENT", { status: 200 })),
}));

describe.concurrent("api/sync/[id]/route suite", () => {
  it.concurrent("GET returns backup asset for authenticated role", async () => {
    const { GET } = await import("./route");
    const req = new Request("https://localhost/api/sync/role2");
    const res = await GET(req as any);
    expect(res.status).toBe(200);
  });
});
