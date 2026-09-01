import { NextResponse } from "next/server";
import {
  getCachedYouTubeVideos,
  type VideoFilter,
} from "@/lib/youtube-service";

export const revalidate = 43200; // 12 hours

export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const filterParam = searchParams.get("filter");
  const filter: VideoFilter =
    filterParam === "last_60_days" || filterParam === "recent"
      ? filterParam
      : "most_viewed";

  try {
    const videos = await getCachedYouTubeVideos(filter);
    return NextResponse.json(videos);
  } catch (error) {
    console.error("Failed to query videos in /api/videos:", error);
    return NextResponse.json([]);
  }
};
