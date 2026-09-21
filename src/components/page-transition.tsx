"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export const PageTransition = ({ children }: { children: React.ReactNode }) => {
  const pathname = usePathname();
  const isFullWidthPage = pathname === "/about" || pathname === "/queries";

  return (
    <main
      key={pathname}
      className={cn(
        "flex-1 w-full flex flex-col",
        !isFullWidthPage && "max-w-7xl mx-auto px-4 py-6",
        pathname === "/queries" && "h-full overflow-hidden",
      )}
      style={{
        animation: "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        willChange: "transform, opacity",
        ...(pathname === "/queries"
          ? { height: "calc(100dvh - 3.75rem)" }
          : {}),
      }}
    >
      {children}
    </main>
  );
};
