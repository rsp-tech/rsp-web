"use client";

import { useQuery } from "@tanstack/react-query";
import { STORE } from "@/constants";
import { getDB } from "@/lib/idb";
import type { UserEditRequest } from "@/types";

export const useUserPendingRequestIdb = (userId: string | undefined) =>
  useQuery({
    queryKey: [STORE.USER_EDIT_REQUESTS, userId],
    queryFn: async (): Promise<UserEditRequest | null> => {
      if (!userId) return null;
      const db = await getDB();
      if (!db) return null;
      const cachedRequests = await db.getAll(STORE.USER_EDIT_REQUESTS);
      const pendingRequest = cachedRequests.find(
        (req) => req.user_id === userId && req.status === "pending",
      );
      return pendingRequest ?? null;
    },
    enabled: !!userId,
  });
