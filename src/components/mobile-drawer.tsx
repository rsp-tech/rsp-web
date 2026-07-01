"use client";

import { Home, LogIn, LogOut, Menu, Paintbrush, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CurrentUserAvatar } from "@/components/current-user-avatar";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { getSupabaseClient } from "@/lib/supabase-browser";
import { getUserDisplayName } from "@/lib/utils";
import { AuthModal } from "./auth-modal";
import { NavLinks } from "./nav-links";
import { useSession } from "./providers";
import { ThemeSelector } from "./theme-selector";

export function MobileDrawer() {
  const router = useRouter();
  const { session, isLoading } = useSession();
  const [authOpen, setAuthOpen] = useState(false);
  const [open, setOpen] = useState(false);

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
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            className="w-8 h-8 md:hidden hover:bg-accent transition-all shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="p-6 flex flex-col gap-6"
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
                  <div className="h-10 w-10 rounded-full overflow-hidden shrink-0 border border-border">
                    <CurrentUserAvatar />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="font-semibold text-sm truncate">
                      {getUserDisplayName(session.user)}
                    </span>
                    {session.user.email && (
                      <span className="text-xs text-muted-foreground truncate">
                        {session.user.email}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1.5 pl-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-2 h-9 hover:bg-accent transition-all"
                    onClick={() => handleNavigate("/profile")}
                  >
                    <User className="w-4 h-4 text-muted-foreground" />
                    Profile
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="justify-start gap-2 h-9 text-destructive hover:text-destructive hover:bg-destructive/10 transition-all"
                    onClick={handleLogout}
                  >
                    <LogOut className="w-4 h-4" />
                    Log out
                  </Button>
                </div>
              </div>
            ) : (
              <div className="py-2">
                <Button
                  type="button"
                  size="sm"
                  onClick={() => setAuthOpen(true)}
                  className="w-full gap-2 justify-center"
                >
                  <LogIn className="w-4 h-4" />
                  Login / Register
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
            >
              <Home className="size-4" />
              <span>Go to Home</span>
            </Link>
            <NavLinks />
          </div>
        </SheetContent>
      </Sheet>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </>
  );
}
