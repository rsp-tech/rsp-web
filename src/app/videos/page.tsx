import type { Metadata } from "next";
import { VideoSanctuaryClient } from "@/components/videos/video-sanctuary-client";
import { getCachedYouTubeVideos } from "@/lib/youtube-service";

export const revalidate = 43200; // 12 hours

export const metadata: Metadata = {
  title: "Video Sanctuary | HG Radheshyam Das Discourses",
  description:
    "Explore pure spiritual video discourses, Bhagavad Gita wisdom, and meditation guides by HG Radheshyam Das in a distraction-free sanctuary.",
};

export default async function VideosPage() {
  const videos = await getCachedYouTubeVideos("most_viewed");

  return <VideoSanctuaryClient initialVideos={videos} />;
}
