"use client";

import { useEffect, useState } from "react";
import { Paintbrush } from "lucide-react";

export type Theme = "clean" | "monk" | "dark" | "compact";

export function ThemeSelector() {
  const [activeTheme, setActiveTheme] = useState<Theme>("clean");

  useEffect(() => {
    // Read from localStorage or default to clean
    const saved = localStorage.getItem("rsp-theme") as Theme;
    if (saved) {
      setActiveTheme(saved);
      applyTheme(saved);
    }
  }, []);

  const applyTheme = (theme: Theme) => {
    const root = document.documentElement;
    // Remove all theme classes
    root.classList.remove("clean", "monk", "dark", "compact");
    // Add new theme class
    root.classList.add(theme);
    localStorage.setItem("rsp-theme", theme);
  };

  const toggleTheme = (theme: Theme) => {
    setActiveTheme(theme);
    applyTheme(theme);
  };

  return (
    <div className="flex items-center gap-2 border border-border bg-card p-1.5 rounded-lg">
      <Paintbrush className="w-4 h-4 text-muted-foreground ml-1" />
      <div className="flex gap-1">
        {(["clean", "monk", "dark", "compact"] as Theme[]).map((theme) => (
          <button
            key={theme}
            type="button"
            onClick={() => toggleTheme(theme)}
            className={`px-2.5 py-1 text-xs font-medium rounded-md transition-all capitalize ${activeTheme === theme
                ? "bg-primary text-primary-foreground shadow-sm"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
          >
            {theme}
          </button>
        ))}
      </div>
    </div>
  );
}
