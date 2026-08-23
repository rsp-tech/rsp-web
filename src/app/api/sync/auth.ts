import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

/**
 * Validates that if a roleId is requested, the caller provides a valid Bearer token
 * and is genuinely entitled to that role (user.app_metadata.role_id === roleId).
 *
 * Returns a NextResponse (401/403) on failure, or null on success.
 */
export const verifyRoleSyncAuth = async (
  request: NextRequest,
  roleId?: number,
): Promise<NextResponse | null> => {
  // Public baseline sync requires no authentication
  if (!roleId) {
    return null;
  }

  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json(
      {
        error: "Unauthorized: role-specific sync requires a valid Bearer token",
      },
      { status: 401 },
    );
  }

  const token = authHeader.slice(7);
  const supabase = getSupabaseServerClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser(token);

  if (authError || !user) {
    return NextResponse.json(
      { error: "Unauthorized: invalid or expired auth token" },
      { status: 401 },
    );
  }

  if (user.app_metadata["role_id"] !== roleId) {
    return NextResponse.json(
      { error: "Forbidden: user is not entitled to the requested role" },
      { status: 403 },
    );
  }

  return null;
};
