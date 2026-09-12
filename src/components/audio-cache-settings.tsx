"use client";

import { FileText, HardDrive, Info, Music } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  useAudioCacheList,
  useAudioCacheSettings,
  useAudioCacheStats,
  useMaterialsCacheList,
} from "@/hooks/use-audio-cache";
import { AudioCacheList } from "./audio-cache-list";
import { MaterialsCacheList } from "./materials-cache-list";

export const AudioCacheSettings = () => {
  const { settings, updateSettings } = useAudioCacheSettings();
  const { data: cachedList = [] } = useAudioCacheList();
  const { data: cachedMaterials = [] } = useMaterialsCacheList();
  const { totalSizeMB, quotaMB, freeMB } = useAudioCacheStats();
  const [activeTab, setActiveTab] = useState<"audio" | "materials">("audio");

  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const size = parseInt(e.target.value, 10);
    updateSettings({ maxCacheSizeMB: size });
    toast.success(`Max cache size set to ${size} MB`);
  };

  const handleToggleMaterialsCache = (checked: boolean | "indeterminate") => {
    const enabled = Boolean(checked);
    updateSettings({ enableMaterialsCache: enabled });
    toast.success(
      enabled
        ? "Study materials offline caching enabled"
        : "Study materials offline caching disabled",
    );
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
            Offline Storage
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-xs font-semibold">Max Audio Cache Limit</span>
          <select
            value={settings.maxCacheSizeMB}
            onChange={handleSizeChange}
            className="w-full px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:bg-accent focus:text-accent-foreground"
          >
            <option value="200">200 MB (Min Limit)</option>
            <option value="500">500 MB</option>
            <option value="1024">1024 MB (1 GB)</option>
            <option value="2048">2048 MB (2 GB)</option>
            <option value="5120">5120 MB (5 GB)</option>
            {quotaMB > 0 && (
              <option value={quotaMB.toString()}>
                MAX Available ({Math.round(quotaMB / 1024)} GB)
              </option>
            )}
          </select>
        </div>

        {/* Study Materials Cache Toggle */}
        <div className="flex items-start gap-2.5 p-3 rounded-xl border border-border bg-muted/20">
          <Checkbox
            id="enable-materials-cache"
            checked={settings.enableMaterialsCache !== false}
            onCheckedChange={handleToggleMaterialsCache}
            className="mt-0.5"
          />
          <div className="flex flex-col gap-1">
            <label
              htmlFor="enable-materials-cache"
              className="text-xs font-semibold cursor-pointer select-none"
            >
              Cache Study Materials
            </label>
            <span className="text-xxs text-muted-foreground leading-snug">
              Save documents and handouts locally to optimize future downloads
              and batch ZIP packaging.
            </span>
          </div>
        </div>

        {/* Materials Disclaimer */}
        <div className="p-3 bg-muted/20 border border-border rounded-xl flex items-start gap-2 text-xxs text-muted-foreground leading-snug">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="flex flex-col gap-1.5">
            <span>
              <strong className="text-foreground">Audio Caching:</strong> Once
              an audio lecture is cached, it plays completely offline and is not
              downloaded again.
            </span>
            <span>
              <strong className="text-foreground">
                Materials Preview &amp; Cache:
              </strong>{" "}
              Material previews use an embedded iframe, which{" "}
              <em>always requires an active internet connection</em>. Local
              caching does not enable offline in-browser preview; it helps only
              to optimize and accelerate future file and batch ZIP downloads.
            </span>
          </div>
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
            <span>Audio Storage Used</span>
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

      {/* Column 2: Cached Files List with Tabs */}
      <div className="lg:col-span-2 p-4 border rounded-2xl bg-card border-border shadow-md flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant={activeTab === "audio" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("audio")}
              className="text-xs font-semibold h-8 gap-1.5 cursor-pointer"
            >
              <Music className="w-4 h-4" />
              Audio Files ({cachedList.length})
            </Button>
            <Button
              type="button"
              variant={activeTab === "materials" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveTab("materials")}
              className="text-xs font-semibold h-8 gap-1.5 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              Study Materials ({cachedMaterials.length})
            </Button>
          </div>
          <span className="text-xxs font-bold tracking-wider uppercase text-muted-foreground hidden md:flex">
            {activeTab === "audio"
              ? `${cachedList.length} Cached`
              : `${cachedMaterials.length} Cached`}
          </span>
        </div>

        {activeTab === "audio" ? <AudioCacheList /> : <MaterialsCacheList />}
      </div>
    </div>
  );
};
