"use client";

import {
  ExternalLink,
  FileText,
  Folder,
  Headphones,
  ImageIcon,
  Paperclip,
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCategories } from "@/hooks/use-categories";
import { useMaterialPreview } from "@/hooks/use-material-preview";
import { categoryPath } from "@/lib/utils";
import type { Material, QueryAttachment } from "@/types";

interface QueryAttachmentListProps {
  attachments?: QueryAttachment[] | null;
}

export const QueryAttachmentList = ({
  attachments,
}: QueryAttachmentListProps) => {
  const { openPreview } = useMaterialPreview();
  const { data: categories } = useCategories();

  if (!attachments || !Array.isArray(attachments) || attachments.length === 0) {
    return null;
  }

  const handlePreviewDriveFile = (att: QueryAttachment) => {
    if (att.type === "image" || att.type === "pdf" || att.type === "material") {
      openPreview({
        id: 0,
        name: att.name,
        uri: att.uri,
        recording_id: 0,
        type: att.type === "image" ? "image" : "pdf",
        size: att.type !== "material" ? (att.size ?? null) : null,
        allowed_roles: [],
        is_generic: false,
        updated_at: null,
      } as Material);
    }
  };

  return (
    <div className="flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/40">
      {attachments.map((att, idx) => {
        const key = `${att.type}-${idx}`;

        if (att.type === "image") {
          return (
            <Button
              key={key}
              type="button"
              variant="ghost"
              onClick={() => handlePreviewDriveFile(att)}
              className="p-0 cursor-pointer"
              style={{ height: "auto" }}
            >
              <Badge
                variant="secondary"
                className="gap-1.5 py-0.5 px-2 text-xs"
              >
                <ImageIcon className="w-3 h-3 text-primary" />
                <span className="max-w-xs truncate">{att.name}</span>
              </Badge>
            </Button>
          );
        }

        if (att.type === "pdf") {
          return (
            <Button
              key={key}
              type="button"
              variant="ghost"
              onClick={() => handlePreviewDriveFile(att)}
              className="p-0 cursor-pointer"
              style={{ height: "auto" }}
            >
              <Badge
                variant="secondary"
                className="gap-1.5 py-0.5 px-2 text-xs"
              >
                <FileText className="w-3 h-3 text-primary" />
                <span className="max-w-xs truncate">{att.name}</span>
              </Badge>
            </Button>
          );
        }

        if (att.type === "link") {
          return (
            <a
              key={key}
              href={att.uri}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex cursor-pointer"
            >
              <Badge
                variant="outline"
                className="gap-1.5 py-0.5 px-2 text-xs text-primary"
              >
                <ExternalLink className="w-3 h-3" />
                <span className="max-w-xs truncate">
                  {att.title || att.uri}
                </span>
              </Badge>
            </a>
          );
        }

        if (att.type === "recording") {
          const catPath =
            att.category_path ||
            (att.category_id
              ? categories?.find((c) => c.id === att.category_id)?.url_path
              : undefined);
          const href = `${categoryPath(catPath)}?q=${att.id}`;

          return (
            <Link key={key} href={href} className="inline-flex cursor-pointer">
              <Badge variant="outline" className="gap-1.5 py-0.5 px-2 text-xs">
                <Headphones className="w-3 h-3 text-primary" />
                <span className="max-w-xs truncate">Lecture: {att.name}</span>
              </Badge>
            </Link>
          );
        }

        if (att.type === "category") {
          const href = att.url_path ? categoryPath(att.url_path) : "/";

          return (
            <Link key={key} href={href} className="inline-flex cursor-pointer">
              <Badge variant="outline" className="gap-1.5 py-0.5 px-2 text-xs">
                <Folder className="w-3 h-3 text-primary" />
                <span className="max-w-xs truncate">Category: {att.name}</span>
              </Badge>
            </Link>
          );
        }

        if (att.type === "material") {
          const catPath =
            att.category_path ||
            (att.category_id
              ? categories?.find((c) => c.id === att.category_id)?.url_path
              : undefined);

          const href = att.recording_id
            ? `${categoryPath(catPath)}?q=${att.recording_id}&m=${att.id}`
            : undefined;

          if (href) {
            return (
              <Link
                key={key}
                href={href}
                className="inline-flex cursor-pointer"
              >
                <Badge
                  variant="outline"
                  className="gap-1.5 py-0.5 px-2 text-xs"
                >
                  <Paperclip className="w-3 h-3 text-primary" />
                  <span className="max-w-xs truncate">
                    Material: {att.name}
                  </span>
                </Badge>
              </Link>
            );
          }

          return (
            <Button
              key={key}
              type="button"
              variant="ghost"
              onClick={() => handlePreviewDriveFile(att)}
              className="p-0 cursor-pointer"
              style={{ height: "auto" }}
            >
              <Badge variant="outline" className="gap-1.5 py-0.5 px-2 text-xs">
                <Paperclip className="w-3 h-3 text-primary" />
                <span className="max-w-xs truncate">Material: {att.name}</span>
              </Badge>
            </Button>
          );
        }

        return null;
      })}
    </div>
  );
};
