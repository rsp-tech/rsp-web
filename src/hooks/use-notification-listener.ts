"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import { useSession } from "@/components/providers";
import { QUERY_KEY } from "@/constants";
import { useOnlineStatus } from "@/hooks/use-online-status";
import { getSupabaseClient } from "@/lib/supabase-browser";

export const useNotificationListener = () => {
  const { session, isLoading: sessionLoading } = useSession();
  const queryClient = useQueryClient();
  const userId = session?.user?.id;
  const isOnline = useOnlineStatus();

  useEffect(() => {
    if (sessionLoading || !isOnline) return;

    // Request permission for browser notifications on first user interaction
    const requestPermissionOnInteraction = () => {
      if ("Notification" in window && Notification.permission === "default") {
        Notification.requestPermission().catch((err) => {
          console.error("Error requesting notification permission:", err);
        });
      }
      window.removeEventListener("click", requestPermissionOnInteraction);
      window.removeEventListener("keydown", requestPermissionOnInteraction);
    };

    if ("Notification" in window && Notification.permission === "default") {
      window.addEventListener("click", requestPermissionOnInteraction);
      window.addEventListener("keydown", requestPermissionOnInteraction);
    }

    const supabase = getSupabaseClient();
    const notifQueryKey = [QUERY_KEY.NOTIFICATIONS, userId];
    const invalidate = () =>
      queryClient.invalidateQueries({ queryKey: notifQueryKey });

    const handleNewNotification = (title: string, message: string) => {
      // Display the toast using sonner
      toast.info(title, {
        description: message,
      });

      // Display browser notification if permission is granted
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification(title, {
            body: message,
          });
        } catch (err) {
          console.error("Failed to trigger browser notification:", err);
        }
      }

      invalidate();
    };

    const channel = supabase
      .channel("realtime-notifications")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "prod", table: "notifications" },
        (payload) => {
          const notif = payload.new;
          if (notif && notif.target_type === "all") {
            handleNewNotification(
              notif.title || "New Announcement",
              notif.message || "",
            );
          } else {
            invalidate();
          }
        },
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
        (payload) => {
          const notif = payload.new;
          handleNewNotification(
            notif?.title || "New Notification",
            notif?.message || "",
          );
        },
      );
    }

    channel.subscribe();

    return () => {
      supabase.removeChannel(channel);
      window.removeEventListener("click", requestPermissionOnInteraction);
      window.removeEventListener("keydown", requestPermissionOnInteraction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, sessionLoading, queryClient, isOnline]);
}
