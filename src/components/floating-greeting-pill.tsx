"use client";

import { Sparkles, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { getAssetById } from "@/lib/asset-registry";
import type { Announcement } from "@/types";

interface FloatingGreetingPillProps {
  announcements: Announcement[];
}

export const FloatingGreetingPill = ({
  announcements,
}: FloatingGreetingPillProps) => {
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    try {
      return (
        window.sessionStorage.getItem("rsp_greeting_pill_dismissed") === "true"
      );
    } catch {
      return false;
    }
  });

  // Find the first announcement with floating greeting enabled
  const activeItem = announcements.find(
    (a) => a.is_active && a.ui_props?.floating_greeting?.enabled,
  );

  if (isDismissed || !activeItem) {
    return null;
  }

  const props = activeItem.ui_props;
  const greeting = props?.floating_greeting;
  const motif = getAssetById(greeting?.icon) || getAssetById(props?.motif_id);
  const text =
    greeting?.text ||
    activeItem.subtitle ||
    activeItem.title ||
    "Auspicious Festival Greetings";

  const handleClick = () => {
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("rsp:trigger-festive-overlay"));
      window.dispatchEvent(new CustomEvent("rsp:trigger-pushpa-vrishti"));
      window.dispatchEvent(new CustomEvent("rsp:trigger-deepotsava"));
      window.dispatchEvent(new CustomEvent("rsp:trigger-celestial-dust"));
    }
  };

  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDismissed(true);
    try {
      window.sessionStorage.setItem("rsp_greeting_pill_dismissed", "true");
    } catch {
      // Ignore storage errors
    }
  };

  return (
    <div
      className="fixed z-50 flex items-center gap-2 select-none backdrop-blur-xs transition-all border border-border rounded-full shadow-md"
      style={{
        bottom: "24px",
        right: "24px",
        backgroundColor: "rgba(24, 24, 27, 0.7)",
        color: "#ffffff",
        padding: "6px 12px 6px 14px",
      }}
    >
      <button
        type="button"
        className="flex items-center gap-2 cursor-pointer bg-transparent p-0"
        onClick={handleClick}
        aria-label={`${text} - Click to replay celebration effects`}
      >
        <div className="flex items-center gap-1.5 shrink-0">
          {motif ? (
            <img
              src={motif.assetPath}
              alt=""
              className="w-4 h-4"
              style={{ objectFit: "contain" }}
            />
          ) : greeting?.icon ? (
            <span className="text-sm leading-none">{greeting.icon}</span>
          ) : (
            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
          )}
        </div>

        <span className="text-xs font-semibold tracking-tight truncate max-w-xs">
          {text}
        </span>
      </button>

      <Button
        size="icon"
        variant="ghost"
        className="w-5 h-5 rounded-full text-white cursor-pointer hover:bg-muted p-0 ml-1"
        style={{ minWidth: "20px" }}
        onClick={handleDismiss}
        aria-label="Dismiss greeting"
      >
        <X className="w-3 h-3" />
      </Button>
    </div>
  );
};
