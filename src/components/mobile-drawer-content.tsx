"use client";

import { Home, LogIn, LogOut, Paintbrush, Settings, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CurrentUserAvatar } from "@/components/current-user-avatar";
import { SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupabaseClient } from "@/lib/supabase-browser";
import { getUserDisplayName } from "@/lib/utils";
import { AuthModal } from "./auth-modal";
import { NavLinks } from "./nav-links";
import { useSession } from "./providers";
import { ThemeSelector } from "./theme-selector";
import { Button } from "./ui/button";

interface MobileDrawerContentProps {
  setOpen: (open: boolean) => void;
}

export const MobileDrawerContent = ({ setOpen }: MobileDrawerContentProps) => {
  const router = useRouter();
  const { session, isLoading } = useSession();
  const [authOpen, setAuthOpen] = useState(false);

  const handleLogout = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
    setOpen(false);
    router.refresh();
  };

  const handleNavigate = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  return (
    <SheetContent
      side="left"
      className="p-6 flex flex-col gap-6 h-full overflow-y-auto"
      style={{ width: "17.5rem" }}
    >
      <SheetHeader className="p-0 border-b border-border pb-4 text-left">
        <SheetTitle className="font-heading font-bold text-lg flex items-center gap-2">
          <span className="text-primary font-serif">RSP</span> Discourses
        </SheetTitle>
      </SheetHeader>

      {/* User Settings Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-80">
          Account
        </h3>
        {isLoading ? (
          <div className="flex items-center gap-3 py-2">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4" style={{ width: "7rem" }} />
              <Skeleton className="h-3" style={{ width: "9rem" }} />
            </div>
          </div>
        ) : session ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 py-1">
              <CurrentUserAvatar />
              <div className="flex flex-col">
                <span className="font-semibold text-sm truncate">
                  {getUserDisplayName(session.user)}
                </span>
                <span className="text-xs text-muted-foreground truncate">
                  {session.user.email}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="justify-start p-0"
                onClick={() => handleNavigate("/profile")}
              >
                <User className="w-4 h-4 text-muted-foreground" />
                Profile
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="justify-start p-0"
                onClick={() => handleNavigate("/settings")}
              >
                <Settings className="w-4 h-4 text-muted-foreground" />
                Cache Settings
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="p-0 justify-start text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                Log out
              </Button>
            </div>
          </div>
        ) : (
          <div className="py-2 flex flex-col gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => setAuthOpen(true)}
              className="w-full gap-2 justify-center"
            >
              <LogIn className="w-4 h-4" />
              Login / Register
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="justify-start p-0 w-full"
              onClick={() => handleNavigate("/settings")}
            >
              <Settings className="w-4 h-4 text-muted-foreground" />
              Cache Settings
            </Button>
          </div>
        )}
      </div>

      <hr className="border-border" />

      {/* Theme Settings Section */}
      <div className="flex flex-col gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground opacity-80 flex items-center gap-1.5">
          <Paintbrush className="w-3 h-3" />
          Theme Settings
        </h3>
        <div className="pt-1">
          <ThemeSelector />
        </div>
      </div>

      {/* Navigation Links */}
      <div className="mt-auto flex flex-col gap-4">
        <Link
          href="/"
          className="hover:text-primary transition-all flex items-center gap-1.5"
          onClick={() => setOpen(false)}
        >
          <Home className="size-4" />
          <span>Go to Home</span>
        </Link>
        <NavLinks onItemClick={() => setOpen(false)} />
      </div>
      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </SheetContent>
  );
};
