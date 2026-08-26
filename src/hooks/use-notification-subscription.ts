import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/components/providers";
import { STORE } from "@/constants";
import { getSupabaseClient } from "@/lib/supabase-browser";
import { toRoleId } from "@/lib/utils";
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

  const roleId = toRoleId(session?.user?.app_metadata?.["role_id"]);

  useEffect(() => {
    if (!userId || !(isTargetPage || roleId === 1) || !queryClient) return;

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

    const channel = supabase.channel(
      roleId === 1 ? "admin-channel" : `user-channel-${userId}`,
    );

    channel.on("broadcast", { event: "sync" }, handleTriggerSync).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, isTargetPage, roleId, session?.access_token, queryClient]);
};
