"use client";

import Image from "next/image";
import Link from "next/link";
import { NotificationCenter } from "./notification-center";
import { SearchBar } from "./search-bar";
import { ThemeSelector } from "./theme-selector";
import { UserNav } from "./user-nav";

export function Header() {
  return (
    <header className="sticky top-0 z-30 w-full border-b border-border bg-background/60 backdrop-blur-md px-4 py-3 flex items-center justify-between gap-4">
      {/* Brand */}
      <Link
        href="/"
        className="flex items-center gap-2 hover:opacity-95 transition-opacity shrink-0"
      >
        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-2 ring-primary/20">
          <Image
            src="/icon-192x192.webp"
            alt="HG Radheshyamdas"
            width={32}
            height={32}
            className="w-full h-full object-cover"
            priority
          />
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

      {/* Search */}
      <div className="flex-1 max-w-md">
        <SearchBar />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3 shrink-0">
        <ThemeSelector />
        <NotificationCenter />
        <UserNav />
      </div>
    </header>
  );
}
