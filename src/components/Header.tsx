"use client";

import { Heart, LogIn, LogOut, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { getSupabaseClient } from "@/lib/supabase-browser";
import { AuthModal } from "./AuthModal";
import { NotificationCenter } from "./NotificationCenter";
import { useSession } from "./providers";
import { SearchBar } from "./SearchBar";
import { ThemeSelector } from "./ThemeSelector";

export function Header() {
  const { session } = useSession();
  const [authOpen, setAuthOpen] = useState(false);

  const handleSignOut = async () => {
    const supabase = getSupabaseClient();
    await supabase.auth.signOut();
  };

  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/80 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-4">
      {/* Brand Logo */}
      <Link
        href="/"
        className="flex items-center gap-2 hover:opacity-95 transition-opacity shrink-0"
      >
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Heart className="w-5 h-5 text-primary-foreground fill-current" />
        </div>
        <div className="hidden sm:flex flex-col">
          <span className="font-bold text-sm font-heading leading-tight text-foreground">
            HG Radheshyamdas
          </span>
          <span className="text-[10px] text-muted-foreground font-semibold leading-none">
            Spiritual Discourses
          </span>
        </div>
      </Link>

      {/* Global Searchbar */}
      <div className="flex-1 max-w-md">
        <SearchBar />
      </div>

      {/* Utilities & Auth */}
      <div className="flex items-center gap-3 shrink-0">
        <ThemeSelector />
        <NotificationCenter />

        {session ? (
          <div className="flex items-center gap-2 border border-border bg-card hover:bg-muted py-1 px-2.5 rounded-lg transition-colors group relative">
            <User className="w-4 h-4 text-muted-foreground group-hover:text-foreground" />
            <span className="text-xs font-semibold text-foreground max-w-[80px] truncate">
              {session.user.email?.split("@")[0]}
            </span>
            <button
              onClick={handleSignOut}
              className="p-1 hover:bg-destructive/10 text-muted-foreground hover:text-destructive rounded-md transition-colors cursor-pointer"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAuthOpen(true)}
            className="flex items-center gap-1.5 bg-primary text-primary-foreground hover:opacity-90 py-1.5 px-3 rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Login</span>
          </button>
        )}
      </div>

      <AuthModal isOpen={authOpen} onClose={() => setAuthOpen(false)} />
    </header>
  );
}
