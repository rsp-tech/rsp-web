"use client";

import { ExternalLink, Eye, FileDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMaterialPreview } from "@/hooks/use-material-preview";
import { getMaterialIcon, isMaterialLink } from "@/lib/material-utils";
import { getAssetUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { Material } from "@/types";

interface MaterialBadgeProps {
  mat: Material;
  isHighlighted?: boolean;
}

export const MaterialBadge = ({ mat, isHighlighted }: MaterialBadgeProps) => {
  const { name, uri } = mat;
  const { openPreview } = useMaterialPreview();
  const isLink = isMaterialLink(uri);

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openPreview(mat);
  };

  const handleDirectDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(getAssetUrl(uri), "_blank", "noopener,noreferrer");
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
    </div>
  );
};
