"use client";

import { Bell } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { Skeleton } from "./ui/skeleton";

const SearchBar = dynamic(
  () => import("./search-bar").then((mod) => mod.SearchBar),
  {
    ssr: false,
    loading: () => <Skeleton className="w-full h-9 max-w-lg animate-shimmer" />,
  },
);

const MobileDrawer = dynamic(
  () => import("./mobile-drawer").then((mod) => mod.MobileDrawer),
  {
    ssr: false,
    loading: () => <Skeleton className="w-8 h-8 md:hidden animate-shimmer" />,
  },
);

const HeaderActions = dynamic(
  () => import("./header-actions").then((mod) => mod.HeaderActions),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center gap-3 shrink-0">
        <Skeleton className="w-8 h-8 animate-shimmer hidden md:flex" />
        <Bell className="h-5 w-5 text-muted-foreground animate-shimmer" />
        <Skeleton className="w-8 h-8 animate-shimmer rounded-full hidden md:flex" />
      </div>
    ),
  },
);

export function Header() {
  return (
    <header
      className="w-full border-b border-border bg-background/50 px-3 sm:px-4 py-3 flex items-center justify-between gap-2 sm:gap-4"
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
          <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-primary/20 hidden md:flex">
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
      <HeaderActions />
    </header>
  );
}
