import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("../meta-service", () => ({
  getCachedSyncMeta: () =>
    Promise.resolve({
      categories: "2026-01-01T00:00:00Z",
    }),
}));

vi.mock("@/lib/feature-flags-service", () => ({
  getCachedFeatureFlags: () =>
    Promise.resolve([
      {
        id: "ga_flag",
        name: "GA Flag",
        description: null,
        is_enabled: true,
        is_ga: true,
        allowed_roles: [],
        allowed_emails: [],
      },
    ]),
  evaluatePublicFlags: () => ["ga_flag"],
}));

describe.concurrent("api/sync/meta route suite", () => {
  it.concurrent("GET returns timestamps and public_feature_flags", async () => {
    const { GET } = await import("./route");

    const res = await GET();
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.categories).toBe("2026-01-01T00:00:00Z");
    expect(json.public_feature_flags).toEqual(["ga_flag"]);
  });
});
