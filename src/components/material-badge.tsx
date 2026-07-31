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
        "inline-flex items-center gap-1 rounded-md text-xs font-semibold transition-all border group overflow-hidden",
        isHighlighted
          ? "bg-primary/25 text-primary border-primary ring-1 ring-primary"
          : "bg-muted hover:bg-primary/10 border-border",
      )}
    >
      <button
        type="button"
        onClick={handlePreviewClick}
        className="inline-flex items-center gap-1.5 px-2 py-1 text-left hover:text-primary transition-colors cursor-pointer"
        title={`Preview ${name} in iframe modal`}
      >
        {getMaterialIcon()}
        <span className="truncate max-w-[8.5rem]">{name}</span>
        <Eye className="w-3 h-3 text-primary opacity-80 group-hover:opacity-100 shrink-0" />
      </button>

      <button
        type="button"
        onClick={handleDirectDownload}
        className="px-1.5 py-1 text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors border-l border-border/60 shrink-0 cursor-pointer"
        title={
          isLink ? "Open directly in new tab" : "Download / View file directly"
        }
      >
        {isLink ? (
          <ExternalLink className="w-3 h-3" />
        ) : (
          <FileDown className="w-3 h-3" />
        )}
      </button>
    </div>
  );
}
