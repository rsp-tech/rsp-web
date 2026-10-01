import type { NextRequest } from "next/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mockGetClaims = vi.fn();

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServerClient: () => ({
    auth: {
      getClaims: mockGetClaims,
    },
  }),
}));

const makeRequest = (token?: string): NextRequest => {
  const headers = new Headers();
  if (token !== undefined) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return new Request("https://localhost/api/sync/7", {
    headers,
  }) as unknown as NextRequest;
};

describe("api/sync/auth with supabase.auth.getClaims", () => {
  beforeEach(() => {
    mockGetClaims.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("rejects request without Authorization header", async () => {
    const { getAuthenticatedRoleId } = await import("./auth");
    const req = new Request("https://localhost/api/sync/7", {
      headers: {},
    }) as unknown as NextRequest;
    const res = await getAuthenticatedRoleId(req);

    expect(res.errorResponse).toBeDefined();
    expect(res.errorResponse?.status).toBe(401);
    const body = await res.errorResponse?.json();
    expect(body.error).toBe("Unauthorized: invalid or expired auth token");
  });

  it("rejects request with empty Bearer token", async () => {
    const { getAuthenticatedRoleId } = await import("./auth");
    const res = await getAuthenticatedRoleId(makeRequest("   "));

    expect(res.errorResponse?.status).toBe(401);
    const body = await res.errorResponse?.json();
    expect(body.error).toBe("Unauthorized: invalid or expired auth token");
    expect(mockGetClaims).not.toHaveBeenCalled();
  });

  it("authenticates valid token via getClaims and extracts roleId", async () => {
    const { getAuthenticatedRoleId } = await import("./auth");
    mockGetClaims.mockResolvedValueOnce({
      data: {
        claims: {
          sub: "user-123",
          app_metadata: { role_id: 7 },
        },
      },
      error: null,
    });

    const res = await getAuthenticatedRoleId(makeRequest("valid-jwt-token"));
    expect(mockGetClaims).toHaveBeenCalledWith("valid-jwt-token");
    expect(res.errorResponse).toBeUndefined();
    expect(res.roleId).toBe(7);
  });

  it("returns generic 401 on getClaims error without leaking internal details", async () => {
    const { getAuthenticatedRoleId } = await import("./auth");
    mockGetClaims.mockResolvedValueOnce({
      data: null,
      error: { message: "Internal JWT verification failed: signature invalid" },
    });

    const res = await getAuthenticatedRoleId(makeRequest("invalid-jwt-token"));
    expect(res.errorResponse?.status).toBe(401);
    const body = await res.errorResponse?.json();
    expect(body.error).toBe("Unauthorized: invalid or expired auth token");
    expect(JSON.stringify(body)).not.toContain("signature invalid");
  });

  it("rejects is_public user with 403 Forbidden directing to public sync", async () => {
    const { getAuthenticatedRoleId } = await import("./auth");
    mockGetClaims.mockResolvedValueOnce({
      data: {
        claims: {
          sub: "user-123",
          app_metadata: { is_public: true, role_id: 7 },
        },
      },
      error: null,
    });

    const res = await getAuthenticatedRoleId(makeRequest("public-jwt-token"));
    expect(res.errorResponse?.status).toBe(403);
    const body = await res.errorResponse?.json();
    expect(body.error).toBe(
      "Forbidden: user has a public role, use public GET /api/sync",
    );
  });

  it("rejects token without valid restricted role_id with 403", async () => {
    const { getAuthenticatedRoleId } = await import("./auth");
    mockGetClaims.mockResolvedValueOnce({
      data: {
        claims: {
          sub: "user-123",
          app_metadata: {},
        },
      },
      error: null,
    });

    const res = await getAuthenticatedRoleId(makeRequest("no-role-token"));
    expect(res.errorResponse?.status).toBe(403);
    const body = await res.errorResponse?.json();
    expect(body.error).toBe(
      "Forbidden: no assigned restricted role found in token",
    );
  });

  it("authenticates getAuthenticatedUser and constructs user object", async () => {
    const { getAuthenticatedUser } = await import("./auth");
    mockGetClaims.mockResolvedValueOnce({
      data: {
        claims: {
          sub: "user-abc-456",
          email: "test@example.com",
          app_metadata: { role_id: 3 },
          user_metadata: { name: "Test User" },
          aud: "authenticated",
        },
      },
      error: null,
    });

    const res = await getAuthenticatedUser(makeRequest("user-token"));
    expect(res.errorResponse).toBeUndefined();
    expect(res.user).toBeDefined();
    expect(res.user?.id).toBe("user-abc-456");
    expect(res.user?.email).toBe("test@example.com");
    expect(res.user?.app_metadata).toEqual({ role_id: 3 });
  });

  it("returns generic 401 in getAuthenticatedUser on error", async () => {
    const { getAuthenticatedUser } = await import("./auth");
    mockGetClaims.mockResolvedValueOnce({
      data: null,
      error: { message: "JWKS lookup failed" },
    });

    const res = await getAuthenticatedUser(makeRequest("bad-token"));
    expect(res.errorResponse?.status).toBe(401);
    const text = await res.errorResponse?.text();
    expect(text).toBe("Unauthorized: invalid or expired auth token");
  });
});
