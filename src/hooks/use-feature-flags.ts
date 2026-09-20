"use client";

import { useQuery } from "@tanstack/react-query";
import { META_KEY, QUERY_KEY, STORE } from "@/constants";
import { getDB } from "@/lib/idb";

export const getPersistedFeatureFlags = async (): Promise<string[]> => {
  // 1. Read persisted public and user features from IDB
  const db = await getDB();
  if (db) {
    const [rawPublicFeatures, rawUserFeatures, storedUserId] =
      await Promise.all([
        db.get(STORE.ROLE_META, META_KEY.PUBLIC_FEATURES),
        db.get(STORE.ROLE_META, META_KEY.USER_FEATURES),
        db.get(STORE.ROLE_META, META_KEY.CLEANUP_USER_ID),
      ]);

    let publicFlags: string[] = [];
    let userFlags: string[] = [];

    if (rawPublicFeatures) {
      try {
        const parsed = JSON.parse(rawPublicFeatures);
        if (Array.isArray(parsed)) publicFlags = parsed;
      } catch {
        // Ignore parse error
      }
    }

    if (storedUserId && rawUserFeatures) {
      try {
        const parsed = JSON.parse(rawUserFeatures);
        if (Array.isArray(parsed)) userFlags = parsed;
      } catch {
        // Ignore parse error
      }
    } else if (!storedUserId && rawUserFeatures) {
      // Invalidate and delete any orphaned/tampered user feature flags
      await db.delete(STORE.ROLE_META, META_KEY.USER_FEATURES);
    }

    return Array.from(new Set([...publicFlags, ...userFlags]));
  }

  return [];
};

export const useFeatureFlags = () =>
  useQuery({
    queryKey: [QUERY_KEY.FEATURE_CONFIG],
    queryFn: getPersistedFeatureFlags,
    staleTime: 60_000,
  });

export const useFeatureFlag = (flagId: string): boolean => {
  const { data: allowedFlags = [] } = useFeatureFlags();
  return allowedFlags.includes(flagId);
};
