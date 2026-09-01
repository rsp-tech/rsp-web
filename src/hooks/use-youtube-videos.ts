"use client";

import { useQuery } from "@tanstack/react-query";
import type { VideoFilter, YouTubeVideo } from "@/lib/youtube-service";

export const useYouTubeVideos = (
  initialVideos?: YouTubeVideo[],
  filter: VideoFilter = "most_viewed",
) =>
  useQuery<YouTubeVideo[]>({
    queryKey: ["youtube-videos", filter],
    queryFn: async () => {
      const res = await fetch(`/api/videos?filter=${filter}`);
      if (!res.ok) return [];
      return (await res.json()) as YouTubeVideo[];
    },
    initialData:
      initialVideos && initialVideos.length > 0 ? initialVideos : undefined,
    staleTime: 1000 * 60 * 60, // 1 hour
  });
