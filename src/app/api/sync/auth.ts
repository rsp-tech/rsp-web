import type { User } from "@supabase/supabase-js";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export interface AuthenticatedRoleResult {
  roleId?: number;
  errorResponse?: NextResponse;
}

export interface AuthenticatedUserResult {
  user?: User;
  errorResponse?: Response;
}

const GENERIC_AUTH_ERROR = "Unauthorized: invalid or expired auth token";

export const getAuthenticatedRoleId = async (
  request: NextRequest,
): Promise<AuthenticatedRoleResult> => {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      errorResponse: NextResponse.json(
        { error: GENERIC_AUTH_ERROR },
        { status: 401 },
      ),
    };
  }

  const token = authHeader.slice(7);
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims(token);

  if (error || !data?.claims) {
    return {
      errorResponse: NextResponse.json(
        { error: GENERIC_AUTH_ERROR },
        { status: 401 },
      ),
    };
  }

  const claims = data.claims as {
    app_metadata?: {
      role_id?: number;
      is_public?: boolean;
    };
  };

  if (claims.app_metadata?.["is_public"]) {
    return {
      errorResponse: NextResponse.json(
        {
          error: "Forbidden: user has a public role, use public GET /api/sync",
        },
        { status: 403 },
      ),
    };
  }

  const roleId = claims.app_metadata?.["role_id"];
  if (typeof roleId !== "number" || roleId <= 0) {
    return {
      errorResponse: NextResponse.json(
        { error: "Forbidden: no assigned restricted role found in token" },
        { status: 403 },
      ),
    };
  }

  return { roleId };
};

export const getAuthenticatedUser = async (
  request: NextRequest,
): Promise<AuthenticatedUserResult> => {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return {
      errorResponse: new Response(GENERIC_AUTH_ERROR, { status: 401 }),
    };
  }

  const token = authHeader.slice(7).trim();
  if (!token) {
    return {
      errorResponse: new Response(GENERIC_AUTH_ERROR, { status: 401 }),
    };
  }

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase.auth.getClaims(token);

  if (error || !data?.claims) {
    return {
      errorResponse: new Response(GENERIC_AUTH_ERROR, { status: 401 }),
    };
  }

  const claims = data.claims as {
    sub?: string;
    app_metadata?: Record<string, unknown>;
    user_metadata?: Record<string, unknown>;
    aud?: string;
    email?: string;
  };

  if (!claims.sub) {
    return {
      errorResponse: new Response(GENERIC_AUTH_ERROR, { status: 401 }),
    };
  }

  const user: User = {
    id: claims.sub,
    app_metadata: claims.app_metadata || {},
    user_metadata: claims.user_metadata || {},
    aud: claims.aud || "authenticated",
    created_at: "",
    email: claims.email,
  };

  return { user };
};
