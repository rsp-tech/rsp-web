"use client";

import { LogIn } from "lucide-react";
import { useState } from "react";
import { CurrentUserAvatar } from "@/components/current-user-avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AuthModal } from "./auth-modal";
import { useSession } from "./providers";
import { DropdownMenu, DropdownMenuTrigger } from "./ui/dropdown-menu";
import { UserNavDropdownContent } from "./user-nav-dropdown-content";

export const UserNav = () => {
  const { session, isLoading } = useSession();
  const [authOpen, setAuthOpen] = useState(false);

  if (isLoading) {
    return <Skeleton className="h-8 w-8 rounded-full" />;
  }

  if (!session) {
    return (
      <>
        <Button
          type="button"
          size="sm"
          onClick={() => setAuthOpen(true)}
          className="gap-1.5"
        >
          <LogIn className="w-3 h-3" />
          Login
        </Button>
        <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
      </>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-8 w-8 rounded-full p-0">
          <CurrentUserAvatar />
        </Button>
      </DropdownMenuTrigger>
      <UserNavDropdownContent {...{ session }} />
    </DropdownMenu>
  );
};
