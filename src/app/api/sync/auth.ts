import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export interface AuthenticatedRoleResult {
  roleId?: number;
  errorResponse?: NextResponse;
}

/**
 * Extracts and securely verifies the caller's role_id from their Bearer JWT.
 * Client never passes role_id; server resolves it directly from the token.
 * Rejects unauthenticated callers, expired tokens, or users without a restricted role.
 */
export const getAuthenticatedRoleId = async (
  request: NextRequest,
): Promise<AuthenticatedRoleResult> => {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      errorResponse: NextResponse.json(
        { error: "Unauthorized: Bearer token required for role sync" },
        { status: 401 },
      ),
    };
  }

  const token = authHeader.slice(7);
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return {
      errorResponse: NextResponse.json(
        { error: "Unauthorized: invalid or expired auth token" },
        { status: 401 },
      ),
    };
  }

  if (user.app_metadata["is_public"]) {
    return {
      errorResponse: NextResponse.json(
        {
          error: "Forbidden: user has a public role, use public GET /api/sync",
        },
        { status: 403 },
      ),
    };
  }

  const roleId = user.app_metadata["role_id"] as number | undefined;
  if (!roleId) {
    return {
      errorResponse: NextResponse.json(
        { error: "Forbidden: no assigned restricted role found in token" },
        { status: 403 },
      ),
    };
  }

  return { roleId };
};

export interface AuthenticatedUserResult {
  user?: User;
  errorResponse?: Response;
}

export const getAuthenticatedUser = async (
  request: NextRequest,
): Promise<AuthenticatedUserResult> => {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      errorResponse: new Response("Unauthorized", { status: 401 }),
    };
  }

  const token = authHeader.slice(7);
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return {
      errorResponse: new Response("Unauthorized", { status: 401 }),
    };
  }

  return { user };
};
