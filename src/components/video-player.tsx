"use client";

import { Loader2, XIcon } from "lucide-react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useVideo } from "@/hooks/use-video";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

export const VideoPlayer = () => {
  const { ytId, title, setYt } = useVideo();
  const isMobile = useIsMobile();
  return (
    <Dialog open={!!ytId} onOpenChange={() => {}}>
      <DialogContent
        className="p-0 overflow-hidden"
        showCloseButton={false}
        style={{
          maxWidth: isMobile ? "calc(100vw - 1rem)" : "48rem",
          gap: 0,
        }}
      >
        <DialogHeader className="flex justify-between items-center p-2">
          <DialogTitle className="font-bold sm:px-4">{title}</DialogTitle>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            title="Close video"
            onClick={() => setYt("", "")}
          >
            <XIcon className="w-4 h-4" />
          </Button>
        </DialogHeader>

        <div
          className="relative w-full flex items-center justify-center p-1"
          style={{
            aspectRatio: "16/9",
            background: "black",
          }}
        >
          {/* Smooth spinner visible only while iframe settles underneath */}
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&modestbranding=1&rel=0&loading=lazy`}
            title={title}
            className="absolute inset-0 w-full h-full z-50 bg-transparent"
            style={{ border: 0, background: "transparent" }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
