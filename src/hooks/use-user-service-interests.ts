"use client";

import { useQuery } from "@tanstack/react-query";
import { STORE } from "@/constants";
import { getDB } from "@/lib/idb";
import type { UserServiceInterest } from "@/types";

export const useUserServiceInterests = (userId: string | undefined) =>
  useQuery({
    queryKey: [STORE.USER_SERVICE_INTERESTS, userId],
    queryFn: async (): Promise<UserServiceInterest[]> => {
      if (!userId) return [];
      const db = await getDB();
      if (!db) return [];

      const all = await db.getAll(STORE.USER_SERVICE_INTERESTS);
      return all.filter((item) => item.user_id === userId);
    },
    enabled: !!userId,
  });
