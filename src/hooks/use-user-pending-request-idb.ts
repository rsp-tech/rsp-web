"use client";

import { useQuery } from "@tanstack/react-query";
import { STORE } from "@/constants";
import { getDB } from "@/lib/idb";
import { getSupabaseClient } from "@/lib/supabase-browser";
import type { UserEditRequest } from "@/types";

export const useUserPendingRequestIdb = (userId: string | undefined) =>
  useQuery({
    queryKey: [STORE.USER_EDIT_REQUESTS, userId],
    queryFn: async (): Promise<UserEditRequest | null> => {
      if (!userId) return null;
      const db = await getDB();
      if (db) {
        const cachedRequests = await db.getAll(STORE.USER_EDIT_REQUESTS);
        const pendingRequest = cachedRequests.find(
          (req) => req.user_id === userId && req.status === "pending",
        );
        if (pendingRequest) return pendingRequest;
      }

      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(STORE.USER_EDIT_REQUESTS)
        .select("*")
        .eq("user_id", userId)
        .eq("status", "pending")
        .maybeSingle();

      if (error) {
        console.error("Error fetching pending request:", error);
        throw error;
      }

      if (db && data) {
        await db.put(STORE.USER_EDIT_REQUESTS, data);
      }
      return data;
    },
    enabled: !!userId,
  });
