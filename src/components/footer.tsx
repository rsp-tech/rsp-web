"use client";

import { NavLinks } from "./nav-links";

export function Footer() {
  return (
    <footer className="w-full border-t border-border bg-background/60 text-card-foreground mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col gap-1 text-center md:text-left">
          <span className="font-bold text-base tracking-tight text-foreground">
            HG Radheshyamdas Spiritual Discourses
          </span>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Radheshyamdas.com. All rights reserved.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-x-6 gap-y-3 text-sm font-semibold text-muted-foreground">
          <NavLinks />
        </div>
      </div>
    </footer>
  );
}
