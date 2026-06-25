"use client";

import {
  BookOpen,
  ExternalLink,
  FileDown,
  FileText,
  GraduationCap,
  Presentation,
} from "lucide-react";
import { getAssetUrl } from "@/lib/storage";
import type { Material } from "@/types";

interface MaterialBadgeProps {
  mat: Material;
  isHighlighted?: boolean;
}

export function MaterialBadge({ mat, isHighlighted }: MaterialBadgeProps) {
  const { name, uri } = mat;
  const lowerName = name.toLowerCase();
  const lowerUri = (uri || "").toLowerCase();

  const isLink = /^https?:\/\//.test(lowerUri);

  const getMaterialIcon = () => {
    if (isLink) {
      return <ExternalLink className="w-3.5 h-3.5 text-info shrink-0" />;
    }
    if (lowerName.includes("teacher")) {
      return <GraduationCap className="w-3.5 h-3.5 text-success shrink-0" />;
    }
    if (lowerName.includes("student") || lowerName.includes("handout")) {
      return <BookOpen className="w-3.5 h-3.5 text-primary shrink-0" />;
    }
    if (lowerUri.endsWith(".pdf") || lowerName.includes(".pdf")) {
      return <FileText className="w-3.5 h-3.5 text-destructive shrink-0" />;
    }
    if (
      lowerUri.endsWith(".ppt") ||
      lowerUri.endsWith(".pptx") ||
      lowerName.includes(".ppt") ||
      lowerName.includes("ppt")
    ) {
      return <Presentation className="w-3.5 h-3.5 text-primary shrink-0" />;
    }
    return <FileText className="w-3.5 h-3.5 text-muted-foreground shrink-0" />;
  };

  const href = isLink ? uri : getAssetUrl(uri);
  const extraProps = isLink
    ? { target: "_blank", rel: "noopener noreferrer" }
    : { download: true };

  return (
    <a
      href={href}
      {...extraProps}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border ${
        isHighlighted
          ? "bg-primary/25 text-primary border-primary ring-1 ring-primary"
          : "bg-muted hover:bg-primary/10 hover:text-primary text-foreground border-border"
      }`}
    >
      {getMaterialIcon()}
      <span className="truncate max-w-37">{name}</span>
      {isLink ? (
        <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />
      ) : (
        <FileDown className="w-3 h-3 text-muted-foreground shrink-0" />
      )}
    </a>
  );
}
