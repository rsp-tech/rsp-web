import { unstable_cache } from "next/cache";
import { CACHE_TAG, REVALIDATE_24_HOURS } from "@/app/api/constants";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { FeatureFlag } from "@/types";
import { User } from "@supabase/supabase-js";

export interface UserSessionLike {
  user?: {
    email?: string | null;
    app_metadata?: Record<string, unknown>;
  } | null;
}

export const getCachedFeatureFlags = unstable_cache(
  async (): Promise<FeatureFlag[]> => {
    try {
      const supabase = getSupabaseServerClient();
      const { data, error } = await supabase
        .from("feature_flags")
        .select("*")
        .order("id");

      if (error) {
        console.error("Failed to fetch feature flags from database:", error);
        return [];
      }

      return (data || []) as FeatureFlag[];
    } catch (err) {
      console.error("Error executing getCachedFeatureFlags query:", err);
      return [];
    }
  },
  [CACHE_TAG.FEATURE_FLAGS],
  {
    revalidate: REVALIDATE_24_HOURS,
    tags: [CACHE_TAG.FEATURE_FLAGS],
  },
);

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
