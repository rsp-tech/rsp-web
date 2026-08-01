"use client";

import { useQuery } from "@tanstack/react-query";
import { STORE } from "@/constants";
import { getDB } from "@/lib/idb";
import { getSupabaseClient } from "@/lib/supabase-browser";
import type {
  QueryReplyWithUser,
  UserEditRequest,
  UserProfile,
  UserQuery,
  UserServiceInterest,
} from "@/types";

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

      // Sort replies ascending
      for (const qId of Object.keys(replies)) {
        replies[qId].sort(
          (a, b) =>
            new Date(a.updated_at ?? 0).getTime() -
            new Date(b.updated_at ?? 0).getTime(),
        );
      }

      return { queries, replies };
    },
    enabled: !!userId,
  });

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
          .from("user_service_interests")
          .select(
            "id, user_id, service_id, level, notes, created_at, updated_at",
          )
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
        .from("users")
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
        .from("user_edit_requests")
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
