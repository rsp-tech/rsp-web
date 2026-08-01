"use client";

import { ExternalLink, FileDown, Loader2, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useMaterialPreview } from "@/hooks/use-material-preview";
import { useVideo } from "@/hooks/use-video";
import { getAssetUrl } from "@/lib/storage";
import type { Material } from "@/types";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

export function getMaterialIframeUrl(mat: Material): string {
  const uri = mat.uri?.trim() || "";
  if (!uri) return "";

  if (/^https?:\/\//i.test(uri)) {
    const ytMatch = uri.match(
      /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/,
    );
    if (ytMatch?.[1]) {
      return `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&modestbranding=1&rel=0`;
    }

    const driveMatch = uri.match(/(?:\/d\/|id=)([\w-]{10,})/);
    if (driveMatch?.[1]) {
      return `https://drive.google.com/file/d/${driveMatch[1]}/preview`;
    }

    return uri;
  }

  if (/^[\w-]{10,}$/.test(uri)) {
    return `https://drive.google.com/file/d/${uri}/preview`;
  }

  return getAssetUrl(uri);
}

export function getMaterialDirectUrl(mat: Material): string {
  const uri = mat.uri?.trim() || "";
  if (!uri) return "";

  if (/^https?:\/\//i.test(uri)) {
    return uri;
  }

  if (/^[\w-]{10,}$/.test(uri)) {
    return `https://drive.google.com/file/d/${uri}/view`;
  }

  return getAssetUrl(uri);
}

export const MediaPreviewModal = () => {
  const { ytId, title: videoTitle, setYt } = useVideo();
  const { material, closePreview } = useMaterialPreview();
  const isMobile = useIsMobile();
  const [iframeLoading, setIframeLoading] = useState(true);

  const isOpen = !!ytId || !!material;
  const isVideo = !!ytId;

  const title = isVideo ? videoTitle : material?.name || "";
  const iframeSrc = isVideo
    ? `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&modestbranding=1&rel=0`
    : material
      ? getMaterialIframeUrl(material)
      : "";
  const directUrl = material ? getMaterialDirectUrl(material) : "";

  const handleClose = () => {
    if (ytId) setYt("", "");
    if (material) closePreview();
  };

  useEffect(() => {
    if (isOpen) {
      setIframeLoading(true);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDownload = () => {
    if (!material || !directUrl) return;
    const a = document.createElement("a");
    a.href = directUrl;
    a.download = material.name;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="p-0 overflow-hidden border border-border bg-background shadow-md"
        showCloseButton={false}
        style={{
          maxWidth: isMobile
            ? "calc(100vw - 1rem)"
            : isVideo
              ? "48rem"
              : "56rem",
          width: "100%",
          gap: 0,
        }}
      >
        <DialogHeader className="flex justify-between items-center p-2 sm:p-3 sm:px-4 border-b border-border bg-muted">
          <DialogTitle
            className="font-bold text-sm truncate sm:px-2"
            style={{ maxWidth: isMobile ? "60%" : "70%" }}
            title={title}
          >
            {title}
          </DialogTitle>

          <div className="flex items-center gap-1 shrink-0">
            {!isVideo && directUrl && (
              <>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title="Open in new tab"
                  onClick={() =>
                    window.open(directUrl, "_blank", "noopener,noreferrer")
                  }
                >
                  <ExternalLink className="w-4 h-4 text-muted-foreground" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  title="Download / Open material"
                  onClick={handleDownload}
                >
                  <FileDown className="w-4 h-4 text-muted-foreground" />
                </Button>
              </>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="Close preview"
              onClick={handleClose}
            >
              <XIcon className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </DialogHeader>

        <div
          className="relative w-full bg-black flex items-center justify-center p-1"
          style={{
            aspectRatio: isVideo ? "16/9" : undefined,
            height: isVideo ? undefined : isMobile ? "75vh" : "80vh",
          }}
        >
          {iframeLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/50 backdrop-blur-xs z-10">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              {!isVideo && (
                <span className="text-xs text-muted-foreground font-medium">
                  Loading material preview...
                </span>
              )}
            </div>
          )}
          <iframe
            src={iframeSrc}
            title={title}
            className="absolute inset-0 w-full h-full z-50 bg-transparent"
            style={{ border: 0, background: "transparent" }}
            onLoad={() => setIframeLoading(false)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
