"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div
      className="fixed z-50 flex items-center gap-3 px-4 py-3 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive-foreground shadow-md animate-in duration-200"
      style={{
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        left: "1rem",
        bottom: "1rem",
      }}
    >
      <WifiOff className="w-4 h-4 text-destructive shrink-0" />
      <div className="flex flex-col gap-1">
        <span className="text-xs font-bold leading-none tracking-tight">
          Offline Mode
        </span>
        <span className="text-xxs opacity-80 leading-none">
          Running from local database
        </span>
      </div>
    </div>
  );
}
