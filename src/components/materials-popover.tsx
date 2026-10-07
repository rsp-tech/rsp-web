"use client";

import { AlertTriangle, Download, Loader2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { STREAM_LIMIT_BYTES } from "@/constants";
import { useBatchDownloader } from "@/hooks/use-batch-downloader";
import { sanitizeFileName } from "@/lib/material-utils";
import { parseSize } from "@/lib/utils";
import type { EnrichedRecording, Material } from "@/types";
import { MaterialBadge } from "./material-badge";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";

interface MaterialsPopoverProps {
  materials: Material[];
  trigger: React.ReactNode;
  m?: string | null;
  rec?: EnrichedRecording;
}

export const MaterialsPopover = ({
  materials,
  trigger,
  m,
  rec,
}: MaterialsPopoverProps) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const { startZipDownload } = useBatchDownloader();
  const hasOverLimitMaterials = materials.some(
    (mat) => parseSize(mat.size) > STREAM_LIMIT_BYTES,
  );

  const handleDownloadAll = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!rec || isDownloading) return;
    setIsDownloading(true);
    try {
      const safeName = sanitizeFileName(rec.name);
      await startZipDownload({
        recordings: [rec],
        selectedAudioIds: new Set(),
        selectedMaterialIds: new Set(materials.map((mat) => mat.id)),
        zipFileName: `${safeName}_materials.zip`,
        shouldCache: true,
      });
      toast.success("Materials download started");
    } catch (err) {
      console.error("Failed to download materials", err);
      toast.error("Failed to download materials");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="start"
        side="top"
        className="flex flex-col gap-2 p-3 bg-card border border-border shadow-md rounded-xl z-50"
        style={{ width: "20rem", maxWidth: "calc(100vw - 2rem)" }}
      >
        <div className="flex items-center justify-between pb-1 border-b border-border">
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              All Materials ({materials.length})
            </span>
            {hasOverLimitMaterials && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center text-warning shrink-0 cursor-pointer">
                    <AlertTriangle className="w-3 h-3" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  Some materials exceed 100 MB, so they will not be included in
                  the ZIP archive and will open in a separate tab.
                </TooltipContent>
              </Tooltip>
            )}
          </div>
          {rec && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isDownloading}
              onClick={handleDownloadAll}
              className="text-xxs font-semibold h-6 px-2 gap-1 text-primary hover:text-primary cursor-pointer"
              title="Download all materials as ZIP"
            >
              {isDownloading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Download className="w-3 h-3" />
              )}
              <span>{isDownloading ? "Downloading..." : "Download All"}</span>
            </Button>
          )}
        </div>
        <div
          className="flex flex-wrap gap-1.5 overflow-y-auto"
          style={{ maxHeight: "12rem" }}
        >
          {materials.map((mat) => {
            const isHighlighted = m != null && Number(m) === mat.id;
            return (
              <MaterialBadge
                key={mat.id}
                mat={mat}
                isHighlighted={isHighlighted}
                rec={rec}
                showCopyLink={true}
              />
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
};
