import { describe, expect, it, vi } from "vitest";
import type { YouTubeVideo } from "@/lib/youtube-service";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: any) => [initial, vi.fn()],
    useMemo: (fn: any) => fn(),
  };
});

vi.mock("@/hooks/use-feature-flags", () => ({
  useFeatureFlag: (flag: string) => flag === "video_sanctuary",
}));

vi.mock("@/hooks/use-video", () => ({
  useVideo: () => ({
    setYt: vi.fn(),
  }),
}));

vi.mock("@/hooks/use-youtube-videos", () => ({
  useYouTubeVideos: (initial?: any) => ({
    data: initial && initial.length > 0 ? initial : [],
  }),
}));

import { VideoSanctuaryClient } from "./video-sanctuary-client";

const mockVideos: YouTubeVideo[] = [
  {
    id: "vid_1",
    title: "Mind Control Discourse",
    publishedAt: "2026-01-01",
    thumbnailUrl: "https://example.com/1.jpg",
    url: "https://youtube.com/watch?v=vid_1",
    viewCount: 15000,
    viewCountFormatted: "15K views",
  },
];

describe.concurrent("VideoSanctuaryClient suite", () => {
  it.concurrent("renders sanctuary client when enabled", () => {
    const el = VideoSanctuaryClient({ initialVideos: mockVideos });
    expect(el).not.toBeNull();
  });

  it.concurrent("exports VideoSanctuaryClient function", () => {
    expect(typeof VideoSanctuaryClient).toBe("function");
  });
});
