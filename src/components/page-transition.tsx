"use client";

import { usePathname } from "next/navigation";

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div
      key={pathname}
      className="flex-1 flex flex-col"
      style={{
        animation: "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        willChange: "transform, opacity",
      }}
    >
      {children}
    </div>
  );
}
