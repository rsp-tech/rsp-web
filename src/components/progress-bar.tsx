"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export const ProgressBar = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset and hide progress bar when route updates
  useEffect(() => {
    setTimeout(() => setProgress(0), 100);
  }, [pathname, searchParams]);

  useEffect(() => {
    const handleAnchorClick = (e: MouseEvent): void => {
      let target = e.target as HTMLElement | null;
      while (target && target.tagName !== "A") {
        target = target.parentElement;
      }

      if (!target) return;

      const anchor = target as HTMLAnchorElement;

      // Verify that it is a valid internal navigation link
      if (anchor.target !== "_blank" && !anchor.hasAttribute("download")) {
        setProgress(75);
        setTimeout(() => setProgress((progress) => (progress ? 90 : 0)), 300);
      }
    };

    document.addEventListener("click", handleAnchorClick);
    return () => {
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  return (
    <div
      className="fixed z-50"
      style={{
        top: 0,
        left: 0,
        height: "3px",
        width: `${progress}%`,
        opacity: progress / 100,
        transition: "width 300ms, opacity 300ms",
        background:
          "linear-gradient(90deg, rgb(225, 79, 0) 0%, rgba(244, 80, 0, 0.25) 100%)",
      }}
    >
      <div className="animate-shimmer w-full h-full rounded-full" />
    </div>
  );
};
