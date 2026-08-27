"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <main
      key={pathname}
      className={cn(
        "flex-1 w-full flex flex-col",
        pathname !== "/about" && "max-w-7xl mx-auto px-4 py-6",
      )}
      style={{
        animation: "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        willChange: "transform, opacity",
      }}
    >
      {children}
    </main>
  );
}
