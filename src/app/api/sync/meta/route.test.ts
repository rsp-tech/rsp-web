import { describe, expect, it, vi } from "vitest";

vi.mock("../meta-service", () => ({
  getCachedSyncMeta: () =>
    Promise.resolve({
      categories: "2026-01-01T00:00:00Z",
    }),
}));

describe.concurrent("api/sync/meta/route suite", () => {
  it.concurrent("GET returns JSON response with sync metadata", async () => {
    const { GET } = await import("./route");
    const res = await GET();
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.categories).toBe("2026-01-01T00:00:00Z");
  });
});
