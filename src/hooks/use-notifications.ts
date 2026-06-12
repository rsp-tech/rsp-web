"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSession } from "@/components/providers";
import { QUERY_KEY } from "@/constants";
import { getSupabaseClient } from "@/lib/supabase-browser";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

const READ_IDS_KEY = "read-notif-ids";

const getReadIds = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(READ_IDS_KEY) || "[]");
  } catch {
    return [];
  }
};

const addReadId = (id: string) => {
  const ids = getReadIds();
  if (!ids.includes(id)) {
    localStorage.setItem(READ_IDS_KEY, JSON.stringify([...ids, id]));
  }
};

const toAppNotification = (
  row: {
    id: string;
    title: string;
    message: string;
    created_at: string | null;
  },
  read = false,
): AppNotification => ({
  id: row.id,
  title: row.title,
  message: row.message,
  read,
  created_at: row.created_at ?? new Date().toISOString(),
});

const fetchNotifications = async (
  sessionUserId: string | undefined,
): Promise<AppNotification[]> => {
  const supabase = getSupabaseClient();
  let list: AppNotification[] = [];

  const { data: publicNotifs, error: pubErr } = await supabase
    .schema("prod")
    .from("notifications")
    .select("*")
    .eq("target_type", "all")
    .order("created_at", { ascending: false });

  if (!pubErr && publicNotifs) {
    list = publicNotifs.map((n) => toAppNotification(n));
  }

  if (sessionUserId) {
    const { data: userNotifs, error: userErr } = await supabase
      .schema("prod")
      .from("user_notifications")
      .select("*")
      .eq("user_id", sessionUserId)
      .order("created_at", { ascending: false });

    if (!userErr && userNotifs) {
      list = [
        ...userNotifs.map((un) => toAppNotification(un, un.read ?? false)),
        ...list,
      ];
    }
  }

  list.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const readIds = getReadIds();
  return list.map((item) =>
    readIds.includes(item.id) ? { ...item, read: true } : item,
  );
};

export const useNotifications = () => {
  const { session, isLoading: sessionLoading } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;

  const query = useQuery({
    queryKey: [QUERY_KEY.NOTIFICATIONS, userId],
    queryFn: () => fetchNotifications(userId),
    enabled: !sessionLoading,
  });

  useEffect(() => {
    if (sessionLoading) return;
    const supabase = getSupabaseClient();

    const notifQueryKey = [QUERY_KEY.NOTIFICATIONS, userId];
    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: notifQueryKey });

    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "prod", table: "notifications" },
        invalidate,
      );

    if (userId) {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "prod",
          table: "user_notifications",
          filter: `user_id=eq.${userId}`,
        },
        invalidate,
      );
    }

    channel.subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, sessionLoading, queryClient]);

  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      if (userId) {
        const { data } = await getSupabaseClient()
          .schema("prod")
          .from("user_notifications")
          .select("id")
          .eq("id", id)
          .single();

        if (data) {
          await getSupabaseClient()
            .schema("prod")
            .from("user_notifications")
            .update({ read: true })
            .eq("id", id);
        }
      }
      addReadId(id);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.NOTIFICATIONS, userId],
      }),
  });

  return {
    notifications: query.data ?? [],
    isLoading: query.isLoading,
    markAsRead: markAsRead.mutate,
  };
};
