"use client";

import { type QueryClient, useQuery } from "@tanstack/react-query";
import { STORE } from "@/constants";
import { getDB } from "@/lib/idb";
import { sortByDate } from "@/lib/utils";
import type { QueryReplyWithUser, UserQuery } from "@/types";

export const useUserQueriesAndReplies = (userId: string | undefined) =>
  useQuery({
    queryKey: [STORE.USER_QUERIES, userId],
    queryFn: async (): Promise<{
      queries: UserQuery[];
      replies: Record<string, QueryReplyWithUser[]>;
    }> => {
      if (!userId) return { queries: [], replies: {} };
      const db = await getDB();
      if (!db) return { queries: [], replies: {} };

      // 1. Fetch queries
      const allQueries = await db.getAll(STORE.USER_QUERIES);
      const queries = allQueries
        .filter((q) => q.user_id === userId)
        .sort(
          (a, b) =>
            new Date(b.created_at ?? 0).getTime() -
            new Date(a.created_at ?? 0).getTime(),
        );

      // 2. Fetch replies
      const allReplies = await db.getAll(STORE.QUERY_REPLIES);
      const replies: Record<string, QueryReplyWithUser[]> = {};
      for (const reply of allReplies) {
        if (!replies[reply.query_id]) {
          replies[reply.query_id] = [];
        }
        replies[reply.query_id].push({
          ...reply,
          users: null, // Satisfy UI type which expects optional joined user profile
        });
      }

      // Sort replies ascending by updated_at (oldest first, newest last)
      for (const qId of Object.keys(replies)) {
        replies[qId].sort(sortByDate());
      }

      return { queries, replies };
    },
    enabled: !!userId,
  });

export const saveUserQueryToIdb = async (
  queryClient: QueryClient,
  userId?: string,
  data?: unknown,
) => {
  if (!userId || !data) return;
  const db = await getDB();
  if (db) {
    await db.put(STORE.USER_QUERIES, data as UserQuery);
  }
  queryClient.invalidateQueries({
    queryKey: [STORE.USER_QUERIES, userId],
  });
};
