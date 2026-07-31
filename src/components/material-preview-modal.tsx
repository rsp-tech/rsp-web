"use client";

import { ExternalLink, FileDown, Loader2, XIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useMaterialPreview } from "@/hooks/use-material-preview";
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

export const MaterialPreviewModal = () => {
  const { material, closePreview } = useMaterialPreview();

  const isMobile = useIsMobile();
  const [iframeLoading, setIframeLoading] = useState(true);

  useEffect(() => {
    if (material) {
      setIframeLoading(true);
    }
  }, [material]);

  if (!material) return null;

  const iframeSrc = getMaterialIframeUrl(material);
  const directUrl = getMaterialDirectUrl(material);

  const handleDownload = () => {
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
    <Dialog open={!!material} onOpenChange={(open) => !open && closePreview()}>
      <DialogContent
        className="p-0 overflow-hidden border border-border bg-background shadow-2xl"
        showCloseButton={false}
        style={{
          maxWidth: isMobile ? "calc(100vw - 1rem)" : "56rem",
          width: "100%",
          gap: 0,
        }}
      >
        <DialogHeader className="flex justify-between items-center p-3 sm:px-4 border-b border-border bg-muted/40">
          <DialogTitle
            className="font-bold text-sm sm:text-base truncate max-w-[60%] sm:max-w-[70%] text-foreground"
            title={material.name}
          >
            {material.name}
          </DialogTitle>

          <div className="flex items-center gap-1 shrink-0">
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
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              title="Close preview"
              onClick={closePreview}
            >
              <XIcon className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>
        </DialogHeader>

        <div className="relative w-full h-[75vh] sm:h-[80vh] bg-muted/20 flex items-center justify-center">
          {iframeLoading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-background/80 z-10">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-xs text-muted-foreground font-medium">
                Loading material preview...
              </span>
            </div>
          )}
          <iframe
            src={iframeSrc}
            title={material.name}
            className="w-full h-full border-0 z-0"
            onLoad={() => setIframeLoading(false)}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
