"use client";

import { useQuery } from "@tanstack/react-query";
import { STORE } from "@/constants";
import { getDB } from "@/lib/idb";
import { getSupabaseClient } from "@/lib/supabase-browser";
import type { UserProfile } from "@/types";

export const useUserProfileIdb = (userId: string | undefined) =>
  useQuery({
    queryKey: [STORE.USERS, userId],
    queryFn: async (): Promise<UserProfile | null> => {
      if (!userId) return null;
      const db = await getDB();
      if (db) {
        const cachedProfile = await db.get(STORE.USERS, userId);
        if (cachedProfile) return cachedProfile;
      }

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(STORE.USERS)
        .select("*")
        .eq("id", userId)
        .single();

      if (error) {
        console.error("Error fetching user profile:", error);
        throw error;
      }

      if (db && data) {
        await db.put(STORE.USERS, data);
      }
      return data;
    },
    enabled: !!userId,
  });
