"use client";

import {
  FileText,
  Folder,
  Globe,
  Headphones,
  ImageIcon,
  Loader2,
  type LucideIcon,
  Paperclip,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FEATURE_FLAGS } from "@/constants";
import { useFeatureFlag } from "@/hooks/use-feature-flags";
import { uploadQueryAttachmentToDrive } from "@/lib/drive-upload";
import type { QueryAttachment } from "@/types";

const MAX_ATTACHMENTS = 5;
const MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024; // 15MB limit

const ATTACHMENT_ICONS: Record<QueryAttachment["type"], LucideIcon> = {
  image: ImageIcon,
  pdf: FileText,
  link: Globe,
  recording: Headphones,
  category: Folder,
  material: Paperclip,
};

const getAttachmentLabel = (att: QueryAttachment): string => {
  switch (att.type) {
    case "recording":
      return `Lecture: ${att.name}`;
    case "category":
      return `Category: ${att.name}`;
    case "material":
      return `Material: ${att.name}`;
    case "link":
      return att.title || att.uri;
    default:
      return att.name;
  }
};

interface QueryAttachmentPickerProps {
  attachments: QueryAttachment[];
  onChange: (attachments: QueryAttachment[]) => void;
  disabled?: boolean;
  onAddLinkInline: () => void;
  onSelectContentInline: () => void;
}

export const QueryAttachmentPicker = ({
  attachments,
  onChange,
  disabled = false,
  onAddLinkInline,
  onSelectContentInline,
}: QueryAttachmentPickerProps) => {
  const fileUploadsEnabled = useFeatureFlag(FEATURE_FLAGS.QUERY_FILE_UPLOADS);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = "";

    if (!fileUploadsEnabled) {
      toast.error("File uploads are currently disabled.");
      return;
    }

    if (attachments.length >= MAX_ATTACHMENTS) {
      toast.error(`Maximum of ${MAX_ATTACHMENTS} attachments reached.`);
      return;
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      toast.error("File exceeds 15MB limit. Please select a smaller file.");
      return;
    }

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";

    if (!isImage && !isPdf) {
      toast.error("Only images and PDF files are supported.");
      return;
    }

    try {
      setUploading(true);
      setUploadPercent(0);

      const uri = await uploadQueryAttachmentToDrive(file, (pct) => {
        setUploadPercent(pct);
      });

      const newAtt: QueryAttachment = isImage
        ? {
            type: "image",
            name: file.name,
            uri,
            mime_type: file.type,
            size: file.size,
          }
        : {
            type: "pdf",
            name: file.name,
            uri,
            mime_type: file.type,
            size: file.size,
          };

      onChange([...attachments, newAtt]);
      toast.success(`${file.name} uploaded!`);
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(
        err instanceof Error ? err.message : "Failed to upload attachment.",
      );
    } finally {
      setUploading(false);
      setUploadPercent(0);
    }
  };

  const handleRemove = (idxToRemove: number) => {
    onChange(attachments.filter((_, idx) => idx !== idxToRemove));
  };

  return (
    <div className="flex flex-col gap-2">
      {fileUploadsEnabled && (
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          className="hidden"
          onChange={handleFileUpload}
          disabled={
            disabled || uploading || attachments.length >= MAX_ATTACHMENTS
          }
        />
      )}

      <div className="flex items-center gap-1.5 flex-wrap">
        {fileUploadsEnabled && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
            disabled={
              disabled || uploading || attachments.length >= MAX_ATTACHMENTS
            }
          >
            {uploading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Upload className="w-3 h-3" />
            )}
            <span>Attach File (Max 15MB)</span>
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs cursor-pointer"
          onClick={onAddLinkInline}
          disabled={disabled || uploading}
        >
          <Globe className="w-3 h-3" />
          <span>Add Link</span>
        </Button>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs cursor-pointer"
          onClick={onSelectContentInline}
          disabled={disabled || uploading}
        >
          <Headphones className="w-3 h-3" />
          <span>Select Lecture / Content</span>
        </Button>
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="w-3 h-3 animate-spin text-primary" />
          <span>Uploading attachment to Google Drive... {uploadPercent}%</span>
        </div>
      )}

      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {attachments.map((att, idx) => {
            const Icon = ATTACHMENT_ICONS[att.type] ?? Paperclip;
            const label = getAttachmentLabel(att);

            return (
              <Badge
                // biome-ignore lint/suspicious/noArrayIndexKey: ok
                key={`${att.type}-${idx}`}
                variant="secondary"
                className="gap-1.5 py-0.5 px-2 text-xs"
              >
                <Icon className="w-3 h-3 text-primary shrink-0" />
                <span className="max-w-xs truncate">{label}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={() => handleRemove(idx)}
                  disabled={disabled || uploading}
                  className="h-4 w-4 p-0 ml-1 text-muted-foreground hover:text-destructive cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
};
