import { unstable_cache } from "next/cache";

export interface YouTubeVideo {
  id: string;
  title: string;
  publishedAt: string;
  thumbnailUrl: string;
  url: string;
  viewCount?: number;
  viewCountFormatted?: string;
  duration?: string;
}

export type VideoFilter = "most_viewed" | "last_60_days" | "recent";

export const YOUTUBE_CHANNEL_ID =
  process.env["YOUTUBE_CHANNEL_ID"] || "UC9Pap1xwEQAo7X1tKqpcpWg";

export const formatViewCount = (count?: number): string => {
  if (!count && count !== 0) return "";
  if (count >= 1_000_000) {
    return `${(count / 1_000_000).toFixed(1).replace(/\.0$/, "")}M views`;
  }
  if (count >= 1_000) {
    return `${(count / 1_000).toFixed(1).replace(/\.0$/, "")}K views`;
  }
  return `${count} views`;
};

const fetchFromYouTubeApi = async (
  filter: VideoFilter,
  apiKey: string,
): Promise<YouTubeVideo[] | null> => {
  try {
    const params = new URLSearchParams({
      part: "snippet",
      channelId: YOUTUBE_CHANNEL_ID,
      maxResults: "12",
      type: "video",
      key: apiKey,
    });

    if (filter === "most_viewed") {
      params.set("order", "viewCount");
    } else if (filter === "last_60_days") {
      params.set("order", "viewCount");
      const sixtyDaysAgo = new Date();
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
      params.set("publishedAfter", sixtyDaysAgo.toISOString());
    } else {
      params.set("order", "date");
    }

    const searchRes = await fetch(
      `https://www.googleapis.com/youtube/v3/search?${params.toString()}`,
      { next: { revalidate: 43200 } }, // 12 hours
    );

    if (!searchRes.ok) {
      console.warn("YouTube API search failed:", await searchRes.text());
      return null;
    }

    const searchJson = (await searchRes.json()) as {
      items?: Array<{
        id?: { videoId?: string };
        snippet?: {
          title?: string;
          publishedAt?: string;
          thumbnails?: {
            high?: { url?: string };
            medium?: { url?: string };
            default?: { url?: string };
          };
        };
      }>;
    };

    const videoIds = (searchJson.items || [])
      .map((item) => item.id?.videoId)
      .filter((id): id is string => Boolean(id));

    if (videoIds.length === 0) return [];

    // Fetch video statistics (view counts)
    const statsParams = new URLSearchParams({
      part: "statistics,contentDetails",
      id: videoIds.join(","),
      key: apiKey,
    });

    const statsRes = await fetch(
      `https://www.googleapis.com/youtube/v3/videos?${statsParams.toString()}`,
      { next: { revalidate: 43200 } },
    );

    const statsMap = new Map<string, { viewCount?: number }>();
    if (statsRes.ok) {
      const statsJson = (await statsRes.json()) as {
        items?: Array<{
          id?: string;
          statistics?: { viewCount?: string };
        }>;
      };
      for (const item of statsJson.items || []) {
        if (item.id) {
          const views = item.statistics?.viewCount
            ? Number.parseInt(item.statistics.viewCount, 10)
            : undefined;
          statsMap.set(item.id, { viewCount: views });
        }
      }
    }

    return (searchJson.items || [])
      .map((item) => {
        const id = item.id?.videoId || "";
        const title = (item.snippet?.title || "")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        const publishedAt = (item.snippet?.publishedAt || "").slice(0, 10);
        const thumbnailUrl =
          item.snippet?.thumbnails?.high?.url ||
          item.snippet?.thumbnails?.medium?.url ||
          `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
        const stats = statsMap.get(id);
        const viewCount = stats?.viewCount;

        return {
          id,
          title,
          publishedAt,
          thumbnailUrl,
          url: `https://www.youtube.com/watch?v=${id}`,
          viewCount,
          viewCountFormatted: formatViewCount(viewCount),
        };
      })
      .filter((v) => Boolean(v.id));
  } catch (err) {
    console.error("Failed to query YouTube API:", err);
    return null;
  }
};

const fetchYouTubeRssVideos = async (): Promise<YouTubeVideo[]> => {
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`,
    );

    if (!res.ok) return [];

    const xml = await res.text();
    const entries = xml.split("<entry>");
    const videos: YouTubeVideo[] = [];

    for (let i = 1; i < entries.length && videos.length < 12; i++) {
      const entry = entries[i];
      const videoIdMatch = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/);
      const titleMatch = entry.match(/<title>(.*?)<\/title>/);
      const publishedMatch = entry.match(/<published>(.*?)<\/published>/);

      if (videoIdMatch && titleMatch) {
        const id = videoIdMatch[1];
        const title = titleMatch[1]
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'");
        const publishedAt = publishedMatch
          ? publishedMatch[1].slice(0, 10)
          : "";

        videos.push({
          id,
          title,
          publishedAt,
          thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          url: `https://www.youtube.com/watch?v=${id}`,
        });
      }
    }

    return videos;
  } catch (error) {
    console.error("Failed to fetch YouTube feed:", error);
    return [];
  }
};

export const fetchYouTubeVideos = async (
  filter: VideoFilter = "most_viewed",
): Promise<YouTubeVideo[]> => {
  const apiKey = process.env["YOUTUBE_API_KEY"];
  if (apiKey) {
    const apiVideos = await fetchFromYouTubeApi(filter, apiKey);
    if (apiVideos && apiVideos.length > 0) {
      return apiVideos;
    }
  }

  // Fallback to RSS feed
  return await fetchYouTubeRssVideos();
};

export const getCachedYouTubeVideos = async (
  filter: VideoFilter = "most_viewed",
): Promise<YouTubeVideo[]> => {
  try {
    const cachedFn = unstable_cache(
      async () => {
        const list = await fetchYouTubeVideos(filter);
        if (!list || list.length === 0) {
          throw new Error("No YouTube videos found to cache");
        }
        return list;
      },
      [`youtube-channel-${filter}`],
      {
        revalidate: 43200, // 12 hours
        tags: ["youtube-videos", `youtube-${filter}`],
      },
    );
    return await cachedFn();
  } catch {
    return await fetchYouTubeVideos(filter);
  }
};
