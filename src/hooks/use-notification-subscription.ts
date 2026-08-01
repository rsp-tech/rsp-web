import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/components/providers";
import { getSupabaseClient } from "@/lib/supabase-browser";
import { toRoleId } from "@/lib/utils";
import type { SyncTable } from "@/workers/utils";
import { runSync } from "./use-sync";

export function useNotificationSubscription(): void {
  const { session } = useSession();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const userId = session?.user?.id;
  const isTargetPage =
    pathname === "/profile" || pathname.startsWith("/queries");

  const roleId = toRoleId(session?.user.app_metadata["role_id"]);
  const isPublic = session?.user.app_metadata["is_public"] as
    | boolean
    | undefined;

  useEffect(() => {
    if (!userId || !(isTargetPage || roleId === 1) || !queryClient) return;
    const handleTriggerSync = (targetTables?: SyncTable[]) =>
      runSync({
        accessToken: session?.access_token ?? "",
        roleId,
        isPublic,
        queryClient,
        userId: session?.user?.id,
        targetTables,
      });

    const supabase = getSupabaseClient();
    const channel = supabase.channel(
      roleId === 1 ? "admin-channel" : `user-channel-${userId}`,
    );

    const handleBroadcast = (payload?: { tables: SyncTable[] }) => {
      const tables = payload?.tables;
      handleTriggerSync(tables);
    };

    channel
      .on("broadcast", { event: "sync" }, ({ payload }) => {
        handleBroadcast(payload);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          handleTriggerSync();
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    userId,
    isTargetPage,
    roleId,
    isPublic,
    session?.access_token,
    session?.user?.id,
    queryClient,
  ]);
}
