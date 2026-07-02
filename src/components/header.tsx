"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { MobileDrawer } from "./mobile-drawer";
import { NotificationCenter } from "./notification-center";
import { ThemeSelector } from "./theme-selector";
import { Skeleton } from "./ui/skeleton";
import { UserNav } from "./user-nav";

const SearchBar = dynamic(
  () => import("./search-bar").then((mod) => mod.SearchBar),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full max-w-lg animate-shimmer" />,
  },
);

export function Header() {
  return (
    <header
      className="w-full border-b border-border bg-background/50 px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4"
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        zIndex: 30,
        top: 0,
        position: "sticky",
      }}
    >
      <div className="flex items-center gap-1 sm:gap-2">
        <MobileDrawer />

        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-1.5 sm:gap-2 hover:opacity-95 transition-all shrink-0"
        >
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-primary/20">
            <picture>
              <source srcSet="/icon-192x192.avif" type="image/avif" />
              <img
                src="/icon-192x192.webp"
                alt="HG Radheshyamdas"
                width={32}
                height={32}
                className="w-full h-full object-cover"
                loading="eager"
                fetchPriority="high"
              />
            </picture>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="font-bold text-sm font-heading leading-tight ">
              HG Radheshyamdas
            </span>
            <span className="text-xxs text-muted-foreground font-semibold leading-none">
              Spiritual Discourses
            </span>
          </div>
        </Link>
      </div>

      {/* Search */}
      <SearchBar />

      {/* Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <div className="hidden md:block">
          <ThemeSelector />
        </div>
        <NotificationCenter />
        <div className="hidden md:block">
          <UserNav />
        </div>
      </div>
    </header>
  );
}
