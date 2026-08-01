"use client";

import Link from "next/link";
import { HeaderActions } from "./header-actions";
import { MobileDrawer } from "./mobile-drawer";
import { SearchBar } from "./search-bar";

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
          aria-label="Home"
          prefetch={false}
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
              HG Radheshyam Das
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
