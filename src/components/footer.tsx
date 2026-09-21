"use client";

import { usePathname } from "next/navigation";
import { NavLinks } from "./nav-links";

export const Footer = () => {
  const pathname = usePathname();
  if (pathname === "/queries") return null;

  return (
    <footer className="w-full border-t border-border bg-background/50 text-foreground mt-auto">
      <div
        className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6"
        style={{ padding: "2rem 1rem" }}
      >
        <div className="flex flex-col gap-1 text-center md:text-left">
          <span className="font-bold tracking-tight ">
            HG Radheshyamdas Spiritual Discourses
          </span>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} Radheshyamdas.com. All rights reserved.
          </p>
        </div>
        <div
          className="flex flex-wrap justify-center text-sm font-semibold text-muted-foreground"
          style={{ columnGap: "1.5rem", rowGap: "0.75rem" }}
        >
          <NavLinks />
        </div>
      </div>
    </footer>
  );
};
