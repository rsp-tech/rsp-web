"use client";

import {
  BookOpen,
  ExternalLink,
  Eye,
  FileDown,
  FileText,
  GraduationCap,
  Presentation,
} from "lucide-react";
import { getMaterialDirectUrl } from "@/components/material-preview-modal";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useMaterialPreview } from "@/hooks/use-material-preview";
import { cn } from "@/lib/utils";
import type { Material } from "@/types";

interface MaterialBadgeProps {
  mat: Material;
  isHighlighted?: boolean;
}

export function MaterialBadge({ mat, isHighlighted }: MaterialBadgeProps) {
  const { name, uri } = mat;
  const { openPreview } = useMaterialPreview();
  const lowerName = name.toLowerCase();
  const lowerUri = (uri || "").toLowerCase();

  const isLink = /^https?:\/\//.test(lowerUri);
  const directUrl = getMaterialDirectUrl(mat);

  const getMaterialIcon = () => {
    if (isLink) {
      return <ExternalLink className="w-3 h-3 shrink-0" />;
    }
    if (lowerName.includes("teacher")) {
      return <GraduationCap className="w-3 h-3 text-success shrink-0" />;
    }
    if (lowerName.includes("student") || lowerName.includes("handout")) {
      return <BookOpen className="w-3 h-3 text-primary shrink-0" />;
    }
    if (lowerUri.endsWith(".ppt") || lowerName.includes("ppt")) {
      return <Presentation className="w-3 h-3 text-primary shrink-0" />;
    }
    return <FileText className="w-3 h-3 text-muted-foreground shrink-0" />;
  };

  const handlePreviewClick = (e: React.MouseEvent) => {
    e.preventDefault();
    openPreview(mat);
  };

  const handleDirectDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isLink || /^[\w-]{10,}$/.test(uri || "")) {
      window.open(directUrl, "_blank", "noopener,noreferrer");
    } else {
      const a = document.createElement("a");
      a.href = directUrl;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
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
            className="font-semibold text-xs h-6 px-2 gap-1"
          >
            {getMaterialIcon()}
            <span className="truncate" style={{ maxWidth: "8.5rem" }}>
              {name}
            </span>
            <Eye className="w-3 h-3 text-primary shrink-0" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="top">
          Preview &ldquo;{name}&rdquo; in iframe viewer
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleDirectDownload}
            className="h-6 w-6 p-0 border-border hover:bg-accent shrink-0"
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
}
