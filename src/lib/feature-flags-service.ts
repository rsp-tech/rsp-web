import type { User } from "@supabase/supabase-js";
import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAG } from "@/app/api/constants";
import { axiomLogger } from "@/lib/axiom-logger";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { FeatureFlag } from "@/types";

export interface UserSessionLike {
  user?: {
    email?: string | null;
    app_metadata?: Record<string, unknown>;
  } | null;
}

export const getCachedFeatureFlags = async (): Promise<FeatureFlag[]> => {
  "use cache: remote";
  cacheLife("month");
  cacheTag(CACHE_TAG.FEATURE_FLAGS);

  try {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from("feature_flags")
      .select("*")
      .order("id");

    if (error) {
      console.error("Failed to fetch feature flags from database:", error);
      axiomLogger.error("Failed to fetch feature flags from database", {
        error,
      });
      return [];
    }

    return (data || []) as FeatureFlag[];
  } catch (err) {
    console.error("Error executing getCachedFeatureFlags query:", err);
    axiomLogger.error("Error executing getCachedFeatureFlags query", {
      error: err,
    });
    return [];
  }
};

export const evaluatePublicFlags = (flags: FeatureFlag[]): string[] =>
  flags.filter((flag) => flag.is_enabled && flag.is_ga).map((flag) => flag.id);

export const evaluateUserFlags = (
  flags: FeatureFlag[],
  user?: User,
): string[] => {
  if (!user) return [];
  const userRoleId = Number(user.app_metadata?.["role_id"]);

  const allowed: string[] = [];
  const userEmail = user.email?.toLowerCase().trim();

  for (const flag of flags) {
    // Only check enabled, non-GA flags (since GA flags are already delivered publicly)
    if (!flag.is_enabled || flag.is_ga) continue;

    if (userRoleId !== undefined && flag.allowed_roles?.includes(userRoleId)) {
      allowed.push(flag.id);
      continue;
    }

    if (
      userEmail &&
      flag.allowed_emails?.some(
        (email) => email.toLowerCase().trim() === userEmail,
      )
    ) {
      allowed.push(flag.id);
    }
  }

  return allowed;
};

export const isFeatureFlagEnabled = async (
  flagId: string,
  userOrUserId?: User | string | null,
): Promise<boolean> => {
  const flags = await getCachedFeatureFlags();
  const publicFlags = evaluatePublicFlags(flags);
  if (publicFlags.includes(flagId)) return true;

  if (!userOrUserId) return false;

  if (typeof userOrUserId === "string") {
    const supabase = getSupabaseServerClient();
    const { data: dbUser } = await supabase
      .from("users")
      .select("role_id, email")
      .eq("id", userOrUserId)
      .maybeSingle();

    if (!dbUser) return false;

    const userLike: User = {
      id: userOrUserId,
      email: dbUser.email ?? undefined,
      app_metadata: { role_id: dbUser.role_id },
      user_metadata: {},
      aud: "",
      created_at: "",
    };
    const userFlags = evaluateUserFlags(flags, userLike);
    return userFlags.includes(flagId);
  }

  const userFlags = evaluateUserFlags(flags, userOrUserId);
  return userFlags.includes(flagId);
};
