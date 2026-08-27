"use client";

import { useQuery } from "@tanstack/react-query";
import { STORE } from "@/constants";
import { getDB } from "@/lib/idb";
import type { UserProfile } from "@/types";

export const useUserProfileIdb = (userId: string | undefined) =>
  useQuery({
    queryKey: [STORE.USERS, userId],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!userId) return null;
      const db = await getDB();
      if (!db) return null;
      const cachedProfile = await db.get(STORE.USERS, userId);
      return cachedProfile ?? null;
    },
    enabled: !!userId,
  });
