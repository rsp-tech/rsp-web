"use client";

import { ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { SiYoutube } from "react-icons/si";
import { YouTubeVideoCard } from "@/components/youtube-video-card";
import { FEATURE_FLAGS } from "@/constants";
import { useFeatureFlag } from "@/hooks/use-feature-flags";
import { useYouTubeVideos } from "@/hooks/use-youtube-videos";
import type { YouTubeVideo } from "@/lib/youtube-service";

interface YouTubeShowcaseProps {
  initialVideos?: YouTubeVideo[];
  videos?: YouTubeVideo[];
}

export const YouTubeShowcase = ({
  initialVideos,
  videos: deprecatedVideos,
}: YouTubeShowcaseProps) => {
  const isEnabled = useFeatureFlag(FEATURE_FLAGS.YOUTUBE_MARQUEE);
  const seedVideos = initialVideos ?? deprecatedVideos;
  const { data: videos = [] } = useYouTubeVideos(seedVideos);
  const [isPaused, setIsPaused] = useState(false);

  // If feature flag is off or no videos fetched, do not render section
  if (!isEnabled || !videos || videos.length === 0) {
    return null;
  }

  // Duplicate items for seamless continuous marquee loop
  const marqueeItems = [...videos, ...videos];

  return (
    <section
      aria-label="Official YouTube Channel Discourses"
      className="flex flex-col gap-4 py-2 overflow-hidden"
    >
      {/* Editorial Section Header */}
      <div className="flex justify-between gap-4 border-b border-border pb-3">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <SiYoutube className="w-4 h-4 shrink-0 text-destructive" />
            <span>Spiritual Reflections · Video Discourses</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-heading text-foreground tracking-tight">
            Official YouTube Discourses
          </h2>
        </div>

        <Link
          href="/videos"
          className="group inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-primary hover:underline shrink-0"
        >
          <span>All Videos</span>
          <ArrowRight className="w-4 h-4 transition-all" />
        </Link>
      </div>

      {/* Infinite Horizontal Marquee Container */}
      {/* biome-ignore lint/a11y/noStaticElementInteractions: pause marquee animation on hover or touch */}
      <div
        className="relative w-full overflow-hidden py-1"
        style={{
          maskImage:
            "linear-gradient(to right, transparent, black 4%, black 96%, transparent)",
          WebkitMaskImage:
            "linear-gradient(to right, transparent, black 4%, black 96%, transparent)",
        }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        <div
          className="flex gap-4 animate-marquee"
          style={{
            width: "max-content",
            animationPlayState: isPaused ? "paused" : "running",
          }}
        >
          {marqueeItems.map((video, idx) => (
            <YouTubeVideoCard
              // biome-ignore lint/suspicious/noArrayIndexKey: duplicated for marquee loop
              key={`${video.id}-${idx}`}
              video={video}
              className="w-72 shrink-0"
              headingLevel="h3"
            />
          ))}
        </div>
      </div>
    </section>
  );
};
