"use client";

import { useQuery } from "@tanstack/react-query";
import { STORE } from "@/constants";
import { getDB } from "@/lib/idb";
import { getSupabaseClient } from "@/lib/supabase-browser";
import type { UserServiceInterest } from "@/types";

export const useUserServiceInterests = (userId: string | undefined) =>
  useQuery({
    queryKey: [STORE.USER_SERVICE_INTERESTS, userId],
    queryFn: async (): Promise<UserServiceInterest[]> => {
      if (!userId) return [];
      const db = await getDB();
      if (!db) return [];

      const all = await db.getAll(STORE.USER_SERVICE_INTERESTS);
      const userInterests = all.filter((item) => item.user_id === userId);

      // Fallback to Supabase if empty (e.g. initial load before sync)
      if (userInterests.length === 0) {
        const supabase = getSupabaseClient();
        const { data, error } = await supabase
          .from(STORE.USER_SERVICE_INTERESTS)
          .select("*")
          .eq("user_id", userId);

        if (!error && data) {
          for (const item of data) {
            await db.put(STORE.USER_SERVICE_INTERESTS, item);
          }
          return data as UserServiceInterest[];
        }
      }
      return userInterests;
    },
    enabled: !!userId,
  });
