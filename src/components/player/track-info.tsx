"use client";

export function TrackInfo() {
  return (
    <div className="flex-1 flex items-center gap-3 min-w-0">
      <div className="flex flex-col min-w-0">
        <h4 className="font-bold text-sm truncate text-primary">
          Active Recording
        </h4>
        <span className="text-xs text-muted-foreground truncate">
          Playing Offline Stream
        </span>
      </div>
    </div>
  );
}
