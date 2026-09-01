import { describe, expect, it, vi } from "vitest";
import type { YouTubeVideo } from "@/lib/youtube-service";
import { useYouTubeVideos } from "./use-youtube-videos";

const mockVideos: YouTubeVideo[] = [
  {
    id: "vid1",
    title: "Video 1",
    publishedAt: "2026-01-01",
    thumbnailUrl: "https://i.ytimg.com/vi/vid1/hqdefault.jpg",
    url: "https://www.youtube.com/watch?v=vid1",
  },
];

let queryConfigPassed: any = null;
vi.mock("@tanstack/react-query", () => ({
  useQuery: (config: any) => {
    queryConfigPassed = config;
    return {
      data: config.initialData ?? mockVideos,
      isLoading: false,
    };
  },
}));

describe.concurrent("use-youtube-videos suite", () => {
  it.concurrent("uses initialVideos as initialData when provided", () => {
    const initial: YouTubeVideo[] = [
      {
        id: "init1",
        title: "Initial 1",
        publishedAt: "2026-01-01",
        thumbnailUrl: "https://i.ytimg.com/vi/init1/hqdefault.jpg",
        url: "https://www.youtube.com/watch?v=init1",
      },
    ];

    const { data } = useYouTubeVideos(initial);
    expect(data).toEqual(initial);
    expect(queryConfigPassed.initialData).toEqual(initial);
  });

  it.concurrent("fetches from /api/videos when initialVideos is empty", async () => {
    useYouTubeVideos([]);
    expect(queryConfigPassed.initialData).toBeUndefined();

    // Test queryFn
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => mockVideos,
    });
    global.fetch = mockFetch;

    const result = await queryConfigPassed.queryFn();
    expect(mockFetch).toHaveBeenCalledWith("/api/videos?filter=most_viewed");
    expect(result).toEqual(mockVideos);
  });
});
