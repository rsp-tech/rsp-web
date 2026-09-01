"use client";

import { Search, Sparkles } from "lucide-react";
import { useMemo, useState } from "react";
import { SiYoutube } from "react-icons/si";
import { YouTubeVideoCard } from "@/components/youtube-video-card";
import { FEATURE_FLAGS } from "@/constants";
import { useFeatureFlag } from "@/hooks/use-feature-flags";
import { useYouTubeVideos } from "@/hooks/use-youtube-videos";
import type { YouTubeVideo } from "@/lib/youtube-service";

interface VideoSanctuaryClientProps {
  initialVideos: YouTubeVideo[];
}

export const VideoSanctuaryClient = ({
  initialVideos,
}: VideoSanctuaryClientProps) => {
  const isEnabled = useFeatureFlag(FEATURE_FLAGS.VIDEOS);
  const { data: videos = initialVideos } = useYouTubeVideos(initialVideos);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "high_impact">("all");

  const filteredVideos = useMemo(() => {
    let list = videos;

    if (activeTab === "high_impact") {
      list = [...list].sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((v) => v.title.toLowerCase().includes(q));
    }

    return list;
  }, [activeTab, searchQuery, videos]);

  if (!isEnabled) {
    return (
      <div className="max-w-2xl mx-auto py-16 px-4 text-center flex flex-col gap-4">
        <SiYoutube className="w-10 h-10 text-muted-foreground mx-auto" />
        <h1 className="text-2xl font-bold font-heading">Video Discourses</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          The video sanctuary is currently being updated. Please explore our
          audio library or check back soon.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 flex flex-col gap-8">
      {/* Editorial Header */}
      <div className="flex flex-col gap-3 text-left border-b border-border pb-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-muted text-foreground border border-border self-start">
          <SiYoutube className="w-4 h-4 text-destructive" />
          <span>Pure Spiritual Sanctuary · Zero Ads &amp; Distractions</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight text-foreground">
          HG Radheshyam Das Discourses
        </h1>

        <p className="text-sm text-muted-foreground max-w-2xl">
          Immerse yourself directly in philosophical seminars, Bhagavad Gita
          wisdom, and meditation guides — streamed cleanly via privacy-enhanced
          playback with zero distracting recommendations.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 w-full">
          <button
            type="button"
            onClick={() => setActiveTab("all")}
            className={`cursor-pointer px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === "all"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            All Discourses
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("high_impact")}
            className={`cursor-pointer inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
              activeTab === "high_impact"
                ? "bg-primary text-primary-foreground shadow-md"
                : "bg-muted hover:bg-muted/80 text-muted-foreground"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Most Impactful
          </button>
        </div>

        <div className="relative w-full">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search discourses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg border border-border bg-card placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-primary transition-all"
          />
        </div>
      </div>

      {/* Video Grid */}
      {filteredVideos.length === 0 ? (
        <div className="text-center py-16 flex flex-col gap-2 border border-border rounded-2xl bg-card">
          <p className="text-muted-foreground text-sm font-medium">
            No video discourses matched your search query.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVideos.map((video) => (
            <YouTubeVideoCard
              key={video.id}
              video={video}
              className="w-full"
              headingLevel="h2"
            />
          ))}
        </div>
      )}
    </div>
  );
};
