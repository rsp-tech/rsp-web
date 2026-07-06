"use client";

import { HardDrive } from "lucide-react";
import { toast } from "sonner";
import {
  useAudioCacheList,
  useAudioCacheSettings,
  useAudioCacheStats,
} from "@/hooks/use-audio-cache";
import { AudioCacheList } from "./audio-cache-list";

export function AudioCacheSettings() {
  const { settings, updateSettings } = useAudioCacheSettings();
  const { data: cachedList = [] } = useAudioCacheList();
  const { totalSizeMB, quotaMB, freeMB } = useAudioCacheStats();

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = parseInt(e.target.value, 10);
    updateSettings({ maxCacheSizeMB: size });
    toast.success(`Max cache size set to ${size} MB`);
  };

  const percentUsed = Math.min(
    100,
    (totalSizeMB / settings.maxCacheSizeMB) * 100,
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full">
      {/* Column 1: Configuration & Estimates */}
      <div className="lg:col-span-1 p-4 border rounded-2xl bg-card border-border shadow-md flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-bold text-sm">Cache Config</h3>
          <span className="text-xxs font-bold tracking-wider uppercase text-muted-foreground">
            Offline Caching
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold">Max Cache Limit</span>
          <select
            value={settings.maxCacheSizeMB}
            onChange={handleSizeChange}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-hidden focus:ring-1 focus:ring-primary focus:bg-accent focus:text-accent-foreground"
          >
            <option value="200">200 MB (Min Limit)</option>
            <option value="500">500 MB</option>
            <option value="1024">1024 MB (1 GB)</option>
            <option value="2048">2048 MB (2 GB)</option>
          </select>
        </div>

        {quotaMB > 0 && (
          <div className="p-3 bg-muted/20 border border-border rounded-xl flex items-start gap-3 text-xs">
            <HardDrive className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="flex flex-col gap-1">
              <span className="font-bold">System Disk Estimate</span>
              <span className="text-muted-foreground text-xxs leading-snug">
                Total Browser Quota: {(quotaMB / 1024).toFixed(1)} GB <br />
                Free Space: {(freeMB / 1024).toFixed(1)} GB available.
              </span>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-2 pt-2">
          <div className="flex justify-between text-xxs font-bold uppercase text-muted-foreground">
            <span>Storage Used</span>
            <span>
              {totalSizeMB} MB / {settings.maxCacheSizeMB} MB
            </span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-200"
              style={{ width: `${percentUsed}%` }}
            />
          </div>
        </div>
      </div>

      {/* Column 2: Cached Files List */}
      <div className="lg:col-span-2 p-4 border rounded-2xl bg-card border-border shadow-md flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="font-bold text-sm">Cached Audio Files</h3>
          <span className="text-xxs font-bold tracking-wider uppercase text-muted-foreground">
            {cachedList.length} Files
          </span>
        </div>
        <AudioCacheList />
      </div>
    </div>
  );
}
