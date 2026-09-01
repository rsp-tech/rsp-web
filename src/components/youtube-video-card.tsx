"use client";

import { Eye, Play } from "lucide-react";
import { YouTubeThumbnail } from "@/components/youtube-thumbnail";
import { useVideo } from "@/hooks/use-video";
import { cn } from "@/lib/utils";
import type { YouTubeVideo } from "@/lib/youtube-service";

interface YouTubeVideoCardProps {
  video: YouTubeVideo;
  className?: string;
  headingLevel?: "h2" | "h3";
}

export const YouTubeVideoCard = ({
  video,
  className,
  headingLevel = "h3",
}: YouTubeVideoCardProps) => {
  const { setYt } = useVideo();
  const Heading = headingLevel;

  const handleClick = () => {
    setYt(video.id, video.title);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-muted shadow-md hover:border-border transition-all duration-200 cursor-pointer focus-visible:ring-1 focus-visible:ring-primary text-left",
        className,
      )}
      style={{ aspectRatio: "16 / 9" }}
    >
      {/* Thumbnail Image */}
      <YouTubeThumbnail
        videoId={video.id}
        initialUrl={video.thumbnailUrl}
        title={video.title}
        className="w-full h-full object-cover transition-all duration-200"
      />

      {/* Dark Vignette / Gradient Overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.9) 0%, rgba(0,0,0,0.35) 60%, rgba(0,0,0,0.1) 100%)",
        }}
      />

      {/* Centered Play Button Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-200 group-hover:scale-125"
          style={{ backgroundColor: "#dc2626", color: "#ffffff" }}
        >
          <Play className="w-4 h-4 ml-1" style={{ fill: "currentColor" }} />
        </div>
      </div>

      {/* Top Views Badge */}
      {video.viewCountFormatted && (
        <div className="absolute top-3 right-3">
          <span
            className="inline-flex items-center gap-1 text-xxs font-semibold px-2 py-0.5 rounded-md backdrop-blur-xs"
            style={{ backgroundColor: "rgba(0,0,0,0.75)", color: "#ffffff" }}
          >
            <Eye className="w-3 h-3" />
            {video.viewCountFormatted}
          </span>
        </div>
      )}

      {/* Bottom Overlay: Title & Date */}
      <div
        className="absolute p-3 flex flex-col gap-1 pointer-events-none"
        style={{ bottom: 0 }}
      >
        <Heading className="font-semibold text-xs sm:text-sm text-white line-clamp-2 leading-snug group-hover:text-primary transition-all">
          {video.title}
        </Heading>
        {video.publishedAt && (
          <span
            className="text-xxs font-medium"
            style={{ color: "rgba(255,255,255,0.7)" }}
          >
            {video.publishedAt}
          </span>
        )}
      </div>
    </button>
  );
};
