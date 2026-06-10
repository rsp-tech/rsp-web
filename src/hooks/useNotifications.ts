"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSession } from "@/components/providers";
import { getSupabaseClient } from "@/lib/supabase-browser";

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}

export function useNotifications() {
  const { session, isLoading: sessionLoading } = useSession();
  const queryClient = useQueryClient();

  const fetchNotifications = async (): Promise<AppNotification[]> => {
    const supabase = getSupabaseClient();
    if (sessionLoading) return [];

    let list: AppNotification[] = [];

    // 1. Fetch public notifications
    const { data: publicNotifs, error: pubErr } = await supabase
      .schema("prod")
      .from("notifications")
      .select("*")
      .eq("target_type", "all")
      .order("created_at", { ascending: false });

    if (!pubErr && publicNotifs) {
      list = publicNotifs.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        read: false, // Local state or read-check via localStorage for public notifications
        created_at: n.created_at || new Date().toISOString(),
      }));
    }

    // 2. Fetch personalized notifications if logged in
    if (session?.user) {
      const { data: userNotifs, error: userErr } = await supabase
        .schema("prod")
        .from("user_notifications")
        .select("*")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (!userErr && userNotifs) {
        const mappedUserNotifs: AppNotification[] = userNotifs.map((un) => ({
          id: un.id,
          title: un.title,
          message: un.message,
          read: un.read ?? false,
          created_at: un.created_at || new Date().toISOString(),
        }));
        list = [...mappedUserNotifs, ...list];
      }
    }

    // Sort by created_at descending
    list.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    );

    // Apply local storage read marks for public notifications
    const readIds = JSON.parse(localStorage.getItem("read-notif-ids") || "[]");
    return list.map((item) => {
      if (readIds.includes(item.id)) {
        return { ...item, read: true };
      }
      return item;
    });
  };

  const query = useQuery({
    queryKey: ["notifications", session?.user?.id],
    queryFn: fetchNotifications,
    enabled: !sessionLoading,
  });

  // Real-time listener for inserting new notifications
  useEffect(() => {
    if (sessionLoading) return;
    const supabase = getSupabaseClient();

    const channel = supabase.channel("realtime-notifications").on(
      "postgres_changes",
      {
        event: "INSERT",
        schema: "prod",
        table: "notifications",
      },
      () => {
        queryClient.invalidateQueries({
          queryKey: ["notifications", session?.user?.id],
        });
      },
    );

    if (session?.user) {
      channel.on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "prod",
          table: "user_notifications",
          filter: `user_id=eq.${session.user.id}`,
        },
        () => {
          queryClient.invalidateQueries({
            queryKey: ["notifications", session?.user?.id],
          });
        },
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id, sessionLoading, queryClient, session?.user]);

  // Mark as read mutation
  const markAsRead = useMutation({
    mutationFn: async (id: string) => {
      const supabase = getSupabaseClient();

      // If it's a user notification (personal), update DB
      if (session?.user) {
        const { data } = await supabase
          .schema("prod")
          .from("user_notifications")
          .select("id")
          .eq("id", id)
          .single();

        if (data) {
          await supabase
            .schema("prod")
            .from("user_notifications")
            .update({ read: true })
            .eq("id", id);
        }
      }

      // Mark locally too (useful for public notifications or fallback)
      const readIds = JSON.parse(
        localStorage.getItem("read-notif-ids") || "[]",
      );
      if (!readIds.includes(id)) {
        readIds.push(id);
        localStorage.setItem("read-notif-ids", JSON.stringify(readIds));
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["notifications", session?.user?.id],
      });
    },
  });

  return {
    notifications: query.data || [],
    isLoading: query.isLoading,
    markAsRead: markAsRead.mutate,
  };
}
