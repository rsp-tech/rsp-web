import { describe, expect, it, vi } from "vitest";

vi.mock("../auth", () => ({
  getAuthenticatedUser: () =>
    Promise.resolve({
      user: {
        id: "user_123",
        email: "beta@example.com",
        app_metadata: { role_id: 2 },
      },
      errorResponse: null,
    }),
}));

vi.mock("../delta-service", () => ({
  computeUserSyncDelta: () =>
    Promise.resolve({
      changed: false,
      sync_meta: {},
      deltas: {},
    }),
}));

vi.mock("@/lib/feature-flags-service", () => ({
  getCachedFeatureFlags: () =>
    Promise.resolve([
      {
        id: "beta_flag",
        name: "Beta Flag",
        description: null,
        is_enabled: true,
        is_ga: false,
        allowed_roles: [2],
        allowed_emails: [],
      },
    ]),
  evaluateUserFlags: () => ["beta_flag"],
}));

describe.concurrent("api/sync/user route suite", () => {
  it.concurrent("POST returns user_feature_flags in delta response", async () => {
    const { POST } = await import("./route");
    const req = new Request("https://localhost/api/sync/user", {
      method: "POST",
      body: JSON.stringify({ watermarks: {} }),
    });

    const res = await POST(req as any);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.user_feature_flags).toEqual(["beta_flag"]);
  });

  it.concurrent("GET returns user seed data from delta-service", async () => {
    const { GET } = await import("./route");
    const req = new Request("https://localhost/api/sync/user", {
      method: "GET",
    });

    const res = await GET(req as any);
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.user_feature_flags).toEqual(["beta_flag"]);
    expect(Array.isArray(json.users)).toBe(true);
    expect(Array.isArray(json.user_queries)).toBe(true);
    expect(Array.isArray(json.query_replies)).toBe(true);
  });
});
