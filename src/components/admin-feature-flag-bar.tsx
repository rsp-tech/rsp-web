"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ShieldCheck } from "lucide-react";
import { useSession } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { QUERY_KEY } from "@/constants";
import { useAdminBypass } from "@/hooks/use-admin-bypass";
import { toRoleId } from "@/lib/utils";

export const AdminFeatureFlagBar = () => {
  const { session } = useSession();
  const queryClient = useQueryClient();
  const { isBypassed, toggleAdminBypass } = useAdminBypass();

  const roleId = toRoleId(
    session?.user?.app_metadata?.["role_id"] ??
      session?.user?.user_metadata?.["role_id"],
  );
  const isAdmin = roleId === 1;

  if (!isAdmin) return null;

  const handleToggle = () => {
    toggleAdminBypass();
    queryClient.invalidateQueries({ queryKey: [QUERY_KEY.FEATURE_CONFIG] });
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="fixed z-50 rounded-full shadow-md text-xs font-semibold cursor-pointer"
      style={{ bottom: "1.25rem", right: "1.25rem" }}
      onClick={handleToggle}
      title="Admin validation: Toggle bypassing all feature flags for this browser session"
    >
      <ShieldCheck className="h-4 w-4 text-primary" />
      <span>Admin FF Bypass:</span>
      <span
        className={
          isBypassed ? "text-primary font-bold" : "text-muted-foreground"
        }
      >
        {isBypassed ? "ON" : "OFF"}
      </span>
    </Button>
  );
};
