"use client";

import {
  AlertTriangle,
  Check,
  Download,
  ExternalLink,
  HardDriveDownload,
  Loader2,
  Music,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useAudioCacheList,
  useAudioCacheSettings,
} from "@/hooks/use-audio-cache";
import { useBatchDownloader } from "@/hooks/use-batch-downloader";
import { getMaterialIcon } from "@/lib/material-utils";
import { getAssetUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { EnrichedRecording } from "@/types";

interface DownloadRecordingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordings: EnrichedRecording[];
  categoryName?: string;
}

const formatSize = (bytes?: number | null): string => {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const DownloadRecordingsModal = ({
  isOpen,
  onClose,
  recordings,
  categoryName = "RSP_Discourses",
}: DownloadRecordingsModalProps) => {
  const { data: cachedList = [] } = useAudioCacheList();
  const { settings } = useAudioCacheSettings();

  const cachedAudioIdSet = useMemo(() => {
    return new Set(cachedList.map((item) => String(item.id)));
  }, [cachedList]);

  // Initial selection: all audio and all materials selected by default
  const [selectedAudioIds, setSelectedAudioIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    for (const rec of recordings) {
      if (rec.audio_id) ids.add(rec.audio_id);
    }
    return ids;
  });

  const [selectedMaterialIds, setSelectedMaterialIds] = useState<Set<number>>(
    () => {
      const ids = new Set<number>();
      for (const rec of recordings) {
        for (const mat of rec.materials ?? []) {
          if (mat.id) ids.add(mat.id);
        }
      }
      return ids;
    },
  );

  const [downloadZip, setDownloadZip] = useState(true);
  const [preserveInCache, setPreserveInCache] = useState(true);

  const {
    isProcessing,
    status,
    progress,
    errorMessage,
    skippedItems,
    startZipDownload,
    startCacheOnly,
    cancel,
    reset,
  } = useBatchDownloader();

  // All available audio IDs & material IDs
  const allAudioIds = useMemo(() => {
    const set = new Set<string>();
    for (const r of recordings) {
      if (r.audio_id) set.add(r.audio_id);
    }
    return set;
  }, [recordings]);

  const allMaterialIds = useMemo(() => {
    const set = new Set<number>();
    for (const r of recordings) {
      for (const m of r.materials ?? []) {
        if (m.id) set.add(m.id);
      }
    }
    return set;
  }, [recordings]);

  const totalAudioCount = allAudioIds.size;
  const totalMaterialCount = allMaterialIds.size;
  const selectedAudioCount = selectedAudioIds.size;
  const selectedMaterialCount = selectedMaterialIds.size;
  const totalSelectedCount = selectedAudioCount + selectedMaterialCount;
  const allCount = totalAudioCount + totalMaterialCount;

  // Real size calculation from database metadata
  const totalBytesSelected = useMemo(() => {
    let bytes = 0;
    for (const rec of recordings) {
      if (rec.audio_id && selectedAudioIds.has(rec.audio_id)) {
        bytes += rec.size || 0;
      }
      for (const mat of rec.materials ?? []) {
        if (selectedMaterialIds.has(mat.id)) {
          bytes += mat.size || 0;
        }
      }
    }
    return bytes;
  }, [recordings, selectedAudioIds, selectedMaterialIds]);

  const totalSelectedMB =
    totalBytesSelected > 0
      ? Math.round((totalBytesSelected / (1024 * 1024)) * 10) / 10
      : 0;

  const exceedsCacheLimit =
    preserveInCache &&
    totalBytesSelected > 0 &&
    selectedAudioCount > 0 &&
    totalSelectedMB > settings.maxCacheSizeMB;

  const handleToggleAudio = (audioId: string) => {
    if (isProcessing) return;
    setSelectedAudioIds((prev) => {
      const next = new Set(prev);
      if (next.has(audioId)) {
        next.delete(audioId);
      } else {
        next.add(audioId);
      }
      return next;
    });
  };

  const handleToggleMaterial = (matId: number) => {
    if (isProcessing) return;
    setSelectedMaterialIds((prev) => {
      const next = new Set(prev);
      if (next.has(matId)) {
        next.delete(matId);
      } else {
        next.add(matId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (isProcessing) return;
    if (totalSelectedCount === allCount) {
      setSelectedAudioIds(new Set());
      setSelectedMaterialIds(new Set());
    } else {
      setSelectedAudioIds(new Set(allAudioIds));
      setSelectedMaterialIds(new Set(allMaterialIds));
    }
  };

  const handleToggleAllAudio = () => {
    if (isProcessing) return;
    if (selectedAudioCount === totalAudioCount) {
      setSelectedAudioIds(new Set());
    } else {
      setSelectedAudioIds(new Set(allAudioIds));
    }
  };

  const handleToggleAllMaterials = () => {
    if (isProcessing) return;
    if (selectedMaterialCount === totalMaterialCount) {
      setSelectedMaterialIds(new Set());
    } else {
      setSelectedMaterialIds(new Set(allMaterialIds));
    }
  };

  const handlePrimaryAction = async () => {
    if (totalSelectedCount === 0 || isProcessing) return;

    if (downloadZip) {
      const safeCat = categoryName.replace(/[/\\?%*:|"<>]/g, "_").trim();
      await startZipDownload({
        recordings,
        selectedAudioIds,
        selectedMaterialIds,
        zipFileName: `${safeCat}.zip`,
        shouldCache: preserveInCache,
      });
    } else if (preserveInCache) {
      await startCacheOnly({
        recordings,
        selectedAudioIds,
        selectedMaterialIds,
      });
    } else {
      // Both unchecked: Direct Google Drive download popup fallback
      for (const rec of recordings) {
        if (rec.audio_id && selectedAudioIds.has(rec.audio_id)) {
          window.open(
            `https://drive.google.com/uc?export=download&id=${rec.audio_id}`,
            "_blank",
          );
        }
        for (const mat of rec.materials ?? []) {
          if (selectedMaterialIds.has(mat.id) && mat.uri) {
            const url = mat.uri.startsWith("http")
              ? mat.uri
              : `https://drive.google.com/uc?export=download&id=${mat.uri}`;
            window.open(url, "_blank");
          }
        }
      }
    }
  };

  const handleModalClose = () => {
    if (isProcessing) {
      cancel();
    }
    reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleModalClose()}>
      <DialogContent
        className="flex flex-col p-4 gap-4 bg-card border-border"
        style={{
          maxHeight: "90vh",
          maxWidth: "42rem",
          width: "calc(100% - 2rem)",
        }}
      >
        <DialogHeader className="flex flex-col gap-1 border-b border-border pb-3">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-bold font-heading flex items-center gap-2">
              <Download className="w-5 h-5 text-primary" />
              Download & Offline Cache
            </DialogTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Select audio tracks and study materials to download as a structured
            ZIP or save to browser cache for offline playback.
          </p>
        </DialogHeader>

        {/* Global Filter Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-muted/40 border border-border rounded-xl text-xs">
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isProcessing}
              onClick={handleSelectAll}
              className="text-xs font-semibold h-6 px-2 cursor-pointer"
            >
              {totalSelectedCount === allCount ? "Deselect All" : "Select All"}
            </Button>
            {totalAudioCount > 0 && (
              <Button
                type="button"
                variant={
                  selectedAudioCount === totalAudioCount ? "default" : "outline"
                }
                size="sm"
                disabled={isProcessing}
                onClick={handleToggleAllAudio}
                className="text-xs font-semibold h-6 px-2 cursor-pointer"
              >
                Audio ({selectedAudioCount}/{totalAudioCount})
              </Button>
            )}
            {totalMaterialCount > 0 && (
              <Button
                type="button"
                variant={
                  selectedMaterialCount === totalMaterialCount
                    ? "default"
                    : "outline"
                }
                size="sm"
                disabled={isProcessing}
                onClick={handleToggleAllMaterials}
                className="text-xs font-semibold h-6 px-2 cursor-pointer"
              >
                Materials ({selectedMaterialCount}/{totalMaterialCount})
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2 text-muted-foreground font-medium">
            <span>
              {totalSelectedCount} files
              {totalBytesSelected > 0 && ` (${totalSelectedMB} MB)`}
            </span>
          </div>
        </div>

        {/* Cache Exceeded Prompt / Warning */}
        {exceedsCacheLimit && (
          <div className="p-3 bg-warning/10 border border-border rounded-xl flex items-start gap-2.5 text-xs text-muted-foreground">
            <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1 leading-snug">
              <span className="font-bold text-foreground">
                Cache Limit Warning ({totalSelectedMB} MB selected vs{" "}
                {settings.maxCacheSizeMB} MB limit)
              </span>
              <span>
                All items will download in the ZIP archive. However, browser
                offline cache may evict older recordings to stay within limit.
                You can{" "}
                <Link
                  href="/settings"
                  className="font-bold text-primary transition-all"
                  onClick={handleModalClose}
                >
                  increase your cache limit in Settings
                </Link>
                .
              </span>
            </div>
          </div>
        )}

        {/* Error Notification */}
        {errorMessage && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center justify-between text-xs text-destructive">
            <span>{errorMessage}</span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={reset}
              className="h-6 px-2 text-destructive cursor-pointer"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Progress Bar when Downloading / Zipping */}
        {isProcessing && (
          <div className="p-4 bg-muted/20 border border-primary/20 rounded-xl flex flex-col gap-2.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="flex items-center gap-2 truncate">
                <Loader2 className="w-4 h-4 animate-spin text-primary shrink-0" />
                <span className="truncate">
                  {status === "zipping"
                    ? "Compressing into ZIP archive..."
                    : progress.currentName || "Downloading files..."}
                </span>
              </span>
              <span className="text-muted-foreground shrink-0 font-bold">
                {progress.percent}% ({progress.completed}/{progress.total})
              </span>
            </div>
            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-200"
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <div className="flex justify-end pt-1">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={cancel}
                className="text-xs h-6 px-3 text-destructive hover:bg-destructive/10 cursor-pointer"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Success State */}
        {status === "completed" && !isProcessing && (
          <div className="p-3 bg-success/10 border border-success/20 rounded-xl flex items-center gap-2 text-xs text-success">
            <Check className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{progress.currentName}</span>
          </div>
        )}

        {/* Skipped Large Files Banner */}
        {skippedItems.length > 0 && !isProcessing && (
          <div className="p-3 bg-warning/10 border border-warning/20 rounded-xl flex flex-col gap-2 text-xs">
            <div className="flex items-center gap-2 text-warning font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                {skippedItems.length} large file(s) require direct download
              </span>
            </div>
            <p className="text-xxs text-muted-foreground leading-snug">
              Files exceeding 100MB cannot be bundled in-browser. You can
              download them directly via Google Drive:
            </p>
            <div className="flex flex-col gap-1.5 pt-1">
              {skippedItems.map((item) => {
                const itemUri = item.uri;
                return (
                  <div
                    key={item.name}
                    className="flex items-center justify-between gap-2 bg-background/50 p-2 rounded-lg border border-border"
                  >
                    <span
                      className="text-xxs font-semibold truncate flex-1"
                      style={{ minWidth: 0 }}
                    >
                      {item.name}
                    </span>
                    {itemUri && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-6 px-2 text-xxs gap-1 text-primary cursor-pointer shrink-0"
                        onClick={() =>
                          window.open(
                            getAssetUrl(itemUri),
                            "_blank",
                            "noopener,noreferrer",
                          )
                        }
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Download</span>
                      </Button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Recordings & Materials List */}
        <div className="flex-1 overflow-y-auto max-h-75 flex flex-col gap-2">
          {recordings.map((rec) => {
            const hasAudio = !!rec.audio_id;
            const isAudioSelected =
              hasAudio && selectedAudioIds.has(rec.audio_id as string);
            const isAudioCached =
              hasAudio && cachedAudioIdSet.has(rec.audio_id as string);
            const recMaterials = rec.materials ?? [];

            return (
              <div
                key={rec.id}
                className={cn(
                  "p-3 border rounded-xl flex flex-col gap-2 transition-all",
                  isAudioSelected ||
                    recMaterials.some((m) => selectedMaterialIds.has(m.id))
                    ? "border-primary/20 bg-muted/20"
                    : "border-border bg-card",
                )}
              >
                {/* Recording Title + Audio Checkbox */}
                <div className="flex items-center justify-between gap-2">
                  <div
                    className="flex items-center gap-2.5 flex-1"
                    style={{ minWidth: 0 }}
                  >
                    {hasAudio ? (
                      <Checkbox
                        id={`rec-audio-${rec.id}`}
                        checked={isAudioSelected}
                        disabled={isProcessing}
                        onCheckedChange={() =>
                          rec.audio_id && handleToggleAudio(rec.audio_id)
                        }
                      />
                    ) : (
                      <span className="w-4 h-4 shrink-0" />
                    )}
                    <Music className="w-4 h-4 text-primary shrink-0" />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <label
                          htmlFor={`rec-audio-${rec.id}`}
                          className="text-xs font-semibold truncate cursor-pointer flex-1"
                          style={{ minWidth: 0 }}
                        >
                          {rec.name}
                        </label>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-xs max-w-sm">
                        {rec.name}
                      </TooltipContent>
                    </Tooltip>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isAudioCached && (
                      <span className="inline-flex items-center gap-1 text-xxs font-bold text-success bg-success/10 px-2 py-0.5 rounded-md">
                        <Check className="w-3 h-3" /> Cached
                      </span>
                    )}
                    {hasAudio && (
                      <span className="text-xxs text-muted-foreground font-medium">
                        {formatSize(rec.size) || "Audio"}
                      </span>
                    )}
                  </div>
                </div>

                {/* Attached Materials Sub-list */}
                {recMaterials.length > 0 && (
                  <div className="pl-6 pt-2 border-t border-border/40 flex flex-col gap-1.5">
                    {recMaterials.map((mat) => {
                      const isMatSelected = selectedMaterialIds.has(mat.id);
                      return (
                        <div
                          key={mat.id}
                          className="flex items-center justify-between gap-2 text-xxs text-muted-foreground hover:text-primary"
                        >
                          <div
                            className="flex items-center gap-2 flex-1"
                            style={{ minWidth: 0 }}
                          >
                            <Checkbox
                              id={`mat-${mat.id}`}
                              checked={isMatSelected}
                              disabled={isProcessing}
                              onCheckedChange={() =>
                                handleToggleMaterial(mat.id)
                              }
                            />
                            {getMaterialIcon(mat)}
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <label
                                  htmlFor={`mat-${mat.id}`}
                                  className="truncate cursor-pointer flex-1"
                                  style={{ minWidth: 0 }}
                                >
                                  {mat.name}
                                </label>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="text-xs max-w-sm"
                              >
                                {mat.name}
                              </TooltipContent>
                            </Tooltip>
                          </div>

                          <span className="text-xxs uppercase tracking-wider opacity-80 shrink-0">
                            {formatSize(mat.size) || mat.type || "Document"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-border pt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isProcessing}
            onClick={handleModalClose}
            className="cursor-pointer"
          >
            Close
          </Button>

          {/* Action Configuration Checkboxes */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted/20 border border-border rounded-xl text-xs">
            <label
              htmlFor="opt-download-zip"
              className="flex items-center gap-2 cursor-pointer select-none font-medium text-foreground"
            >
              <Checkbox
                id="opt-download-zip"
                checked={downloadZip}
                disabled={isProcessing}
                onCheckedChange={(checked) => setDownloadZip(Boolean(checked))}
              />
              <span>Download ZIP Archive</span>
            </label>

            <label
              htmlFor="opt-preserve-cache"
              className="flex items-center gap-2 cursor-pointer select-none font-medium text-foreground"
            >
              <Checkbox
                id="opt-preserve-cache"
                checked={preserveInCache}
                disabled={isProcessing}
                onCheckedChange={(checked) =>
                  setPreserveInCache(Boolean(checked))
                }
              />
              <span>Preserve in Offline Cache</span>
            </label>
          </div>

          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={totalSelectedCount === 0 || isProcessing}
            onClick={handlePrimaryAction}
            className="text-xs font-semibold cursor-pointer"
          >
            {downloadZip && preserveInCache && (
              <>
                <Download className="w-4 h-4" />
                <span>
                  {totalSelectedCount === 1
                    ? "Download & Cache"
                    : `Download ZIP & Cache (${totalSelectedCount})`}
                </span>
              </>
            )}
            {downloadZip && !preserveInCache && (
              <>
                <Download className="w-4 h-4" />
                <span>
                  {totalSelectedCount === 1
                    ? "Download File"
                    : `Download ZIP (${totalSelectedCount})`}
                </span>
              </>
            )}
            {!downloadZip && preserveInCache && (
              <>
                <HardDriveDownload className="w-4 h-4" />
                <span>
                  {totalSelectedCount === 1
                    ? "Cache Offline"
                    : `Cache Offline (${totalSelectedCount})`}
                </span>
              </>
            )}
            {!downloadZip && !preserveInCache && (
              <>
                <ExternalLink className="w-4 h-4" />
                <span>
                  {totalSelectedCount === 1
                    ? "Open Direct Download"
                    : `Open Direct Downloads (${totalSelectedCount})`}
                </span>
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
