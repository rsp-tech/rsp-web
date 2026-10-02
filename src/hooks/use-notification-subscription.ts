import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/components/providers";
import { STORE } from "@/constants";
import { getSupabaseClient } from "@/lib/supabase-browser";
import { runUserSync } from "./use-user-sync";

interface SyncBroadcastEvent {
  payload?: {
    tables?: string[];
  };
}

export const useNotificationSubscription = (): void => {
  const { session } = useSession();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const userId = session?.user?.id;
  const isTargetPage =
    pathname === "/profile" || pathname.startsWith("/queries");

  useEffect(() => {
    if (!userId || !isTargetPage || !queryClient) return;

    const supabase = getSupabaseClient();

    const handleTriggerSync = async (event?: SyncBroadcastEvent) => {
      const tables = event?.payload?.tables;
      const isUserTableUpdated =
        Array.isArray(tables) && tables.includes(STORE.USERS);

      try {
        let currentToken = session?.access_token ?? "";
        if (isUserTableUpdated) {
          const { data: refreshData } = await supabase.auth.refreshSession();
          currentToken = refreshData?.session?.access_token ?? currentToken;
        }

        runUserSync({
          queryClient,
          userId,
          accessToken: currentToken,
        });
      } catch (err) {
        console.error("Failed to refresh session or run user sync:", err);
      }
    };

    const channel = supabase.channel(`user-channel-${userId}`);

    channel.on("broadcast", { event: "sync" }, handleTriggerSync).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isTargetPage, session?.access_token, queryClient]);
};
