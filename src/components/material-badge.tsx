"use client";

import {
  AlertTriangle,
  Check,
  ExternalLink,
  Eye,
  FileDown,
  Link2,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { STREAM_LIMIT_BYTES } from "@/constants";
import { useCategories } from "@/hooks/use-categories";
import { useMaterialPreview } from "@/hooks/use-material-preview";
import { getMaterialIcon, isMaterialLink } from "@/lib/material-utils";
import { getAssetUrl } from "@/lib/storage";
import {
  buildRecordingPermalink,
  cn,
  copyToClipboard,
  parseSize,
} from "@/lib/utils";
import type { EnrichedRecording, Material } from "@/types";

interface MaterialBadgeProps {
  mat: Material;
  isHighlighted?: boolean;
  rec?: EnrichedRecording;
  showCopyLink?: boolean;
}

export const MaterialBadge = ({
  mat,
  isHighlighted,
  rec,
  showCopyLink,
}: MaterialBadgeProps) => {
  const { name, uri } = mat;
  const { openPreview } = useMaterialPreview();
  const { data: categories } = useCategories();
  const [isCopied, setIsCopied] = useState(false);
  const isLink = isMaterialLink(uri);
  const isOverLimit = parseSize(mat.size) > STREAM_LIMIT_BYTES;

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openPreview(mat);
  };

  const handleDirectDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(getAssetUrl(uri), "_blank", "noopener,noreferrer");
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    let url = "";
    if (rec) {
      const cat = categories?.find((c) => c?.id === rec.category_id);
      url = buildRecordingPermalink({
        categoryUrlPath: cat?.url_path,
        recId: rec.id,
        matId: mat.id,
      });
    } else {
      url = isLink ? mat.uri : getAssetUrl(mat.uri);
    }

    const success = await copyToClipboard(url);
    if (success) {
      setIsCopied(true);
      toast.success(`Link to "${name}" copied`);
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      toast.error("Failed to copy link");
    }
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded-md border group overflow-hidden",
        isHighlighted
          ? "border-primary bg-primary/20 ring-1 ring-primary"
          : "border-border bg-muted hover:bg-primary/10",
      )}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handlePreviewClick}
            className={cn(
              "font-semibold text-xs h-6 px-2 gap-1",
              isLink && "pointer-events-none",
            )}
          >
            {getMaterialIcon(mat)}
            <span className="truncate" style={{ maxWidth: "8.5rem" }}>
              {name}
            </span>
            {!isLink && <Eye className="w-3 h-3 text-primary shrink-0" />}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">Preview &ldquo;{name}&rdquo;</TooltipContent>
      </Tooltip>

      {isOverLimit && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              className="inline-flex items-center px-1 text-warning shrink-0 cursor-pointer"
              style={{ borderLeft: "1px solid var(--border)" }}
            >
              <AlertTriangle className="w-3 h-3" />
            </span>
          </TooltipTrigger>
          <TooltipContent side="top" className="max-w-xs text-xs">
            File exceeds 100 MB, so it will not be included in ZIP downloads and
            will open in a separate tab for direct download.
          </TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDirectDownload}
            className="h-6 w-6 p-0 border-border hover:bg-accent shrink-0"
            style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
          >
            {isLink ? (
              <ExternalLink className="w-3 h-3 text-muted-foreground" />
            ) : (
              <FileDown className="w-3 h-3 text-muted-foreground" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          {isLink ? `Open ${name} in new tab` : `Download ${name} directly`}
        </TooltipContent>
      </Tooltip>

      {showCopyLink && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleCopyLink}
              className="h-6 w-6 p-0 border-border hover:bg-accent shrink-0"
              style={{
                borderLeft: "1px solid var(--border)",
                borderTopLeftRadius: 0,
                borderBottomLeftRadius: 0,
              }}
            >
              {isCopied ? (
                <Check className="w-3 h-3 text-success" />
              ) : (
                <Link2 className="w-3 h-3 text-muted-foreground" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">
            {isCopied ? "Copied!" : `Copy link to ${name}`}
          </TooltipContent>
        </Tooltip>
      )}
    </div>
  );
};
