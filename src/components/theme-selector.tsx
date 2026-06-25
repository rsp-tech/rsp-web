"use client";

import { Paintbrush } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

export type Theme = "clean" | "monk" | "dark";
const COLOR_THEMES: Theme[] = ["clean", "monk", "dark"];

const themeButtonCn = (active: boolean) =>
  cn(
    "px-2.5 py-1 text-xs font-medium rounded-md transition-all capitalize",
    active
      ? "bg-primary text-primary-foreground shadow-sm"
      : "text-muted-foreground hover:bg-muted hover:text-foreground",
  );

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [compact, setCompact] = useState(false);

  // Sync compact class with html element
  useEffect(() => {
    const saved = localStorage.getItem("rsp-compact") === "true";
    setCompact(saved);
    document.documentElement.classList.toggle("compact", saved);
  }, []);

  const toggleCompact = () => {
    const next = !compact;
    setCompact(next);
    document.documentElement.classList.toggle("compact", next);
    localStorage.setItem("rsp-compact", String(next));
  };

  return (
    <div className="group/theme flex items-center gap-1 hover:gap-2 border border-border bg-card p-1.5 rounded-lg transition-all duration-300 ease-out shrink-0">
      <Paintbrush className="w-4 h-4 text-muted-foreground ml-1 shrink-0 hidden md:block" />
      <div className="flex gap-1 overflow-hidden transition-all duration-300 ease-out origin-left max-w-xs opacity-100 scale-x-100 md:max-w-0 md:opacity-0 md:scale-x-90 md:group-hover/theme:max-w-xs md:group-hover/theme:opacity-100 md:group-hover/theme:scale-x-100">
        {COLOR_THEMES.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTheme(t)}
            className={themeButtonCn(theme === t)}
          >
            {t}
          </button>
        ))}
        <button
          type="button"
          onClick={toggleCompact}
          className={themeButtonCn(compact)}
        >
          compact
        </button>
      </div>
    </div>
  );
}
