"use client";

import type { Session } from "@supabase/supabase-js";
import { LogOut, User } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { getSupabaseClient } from "@/lib/supabase-browser";
import { getUserDisplayName } from "@/lib/utils";
import { CurrentUserAvatar } from "./current-user-avatar";

interface UserNavDropdownContentProps {
  session: Session;
}

export const UserNavDropdownContent = ({
  session,
}: UserNavDropdownContentProps) => {
  const router = useRouter();
  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    router.refresh();
  };
  return (
    <DropdownMenuContent align="end" style={{ width: "16rem" }}>
      <DropdownMenuLabel className="border-b border-border flex gap-3">
        <CurrentUserAvatar />
        <div className="flex flex-col gap-1">
          <p className="text-sm font-medium leading-none whitespace-nowrap">
            {getUserDisplayName(session.user)}
          </p>
          <p className="text-xs text-muted-foreground truncate whitespace-nowrap">
            {session.user.email}
          </p>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuGroup>
        <DropdownMenuItem onClick={() => router.push("/profile")}>
          <User className="mr-2 h-4 w-4" />
          Profile
        </DropdownMenuItem>
      </DropdownMenuGroup>
      <DropdownMenuItem
        onClick={handleLogout}
        className="text-destructive focus:text-destructive focus:bg-destructive/10"
      >
        <LogOut className="mr-2 h-4 w-4" />
        Log out
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
};
