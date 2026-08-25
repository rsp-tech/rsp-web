import { useQueryClient } from "@tanstack/react-query";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/components/providers";
import { getSupabaseClient } from "@/lib/supabase-browser";
import { toRoleId } from "@/lib/utils";
import { runUserSync } from "./use-user-sync";

export function useNotificationSubscription(): void {
  const { session } = useSession();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  const userId = session?.user?.id;
  const isTargetPage =
    pathname === "/profile" || pathname.startsWith("/queries");

  const roleId = toRoleId(session?.user.app_metadata["role_id"]);

  useEffect(() => {
    if (!userId || !(isTargetPage || roleId === 1) || !queryClient) return;
    const handleTriggerSync = () =>
      runUserSync({
        queryClient,
        userId: session?.user?.id,
        accessToken: session?.access_token ?? "",
      });

    const supabase = getSupabaseClient();
    const channel = supabase.channel(
      roleId === 1 ? "admin-channel" : `user-channel-${userId}`,
    );

    channel.on("broadcast", { event: "sync" }, handleTriggerSync).subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    userId,
    isTargetPage,
    roleId,
    session?.access_token,
    session?.user?.id,
    queryClient,
  ]);
}
