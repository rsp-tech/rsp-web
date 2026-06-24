"use client";

import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "@/hooks/use-online-status";

export function OfflineIndicator() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl border border-destructive/20 bg-destructive/10 text-destructive-foreground backdrop-blur-md shadow-lg animate-in slide-in-from-bottom-5 duration-300">
      <WifiOff className="w-4 h-4 text-destructive shrink-0" />
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-bold leading-none tracking-tight">
          Offline Mode
        </span>
        <span className="text-[10px] opacity-80 leading-none">
          Running from local database
        </span>
      </div>
    </div>
  );
}
