import { describe, expect, it, vi } from "vitest";
import type { YouTubeVideo } from "@/lib/youtube-service";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: any) => [initial, vi.fn()],
  };
});

vi.mock("@/hooks/use-feature-flags", () => ({
  useFeatureFlag: (flag: string) => flag === "youtube_marquee",
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

import { YouTubeShowcase } from "./youtube-showcase";

const mockVideos: YouTubeVideo[] = [
  {
    id: "vid_1",
    title: "Video One",
    publishedAt: "2026-01-01",
    thumbnailUrl: "https://example.com/1.jpg",
    url: "https://youtube.com/watch?v=vid_1",
    viewCountFormatted: "10K views",
  },
];

describe.concurrent("src/components/youtube-showcase.tsx suite", () => {
  it.concurrent("exports YouTubeShowcase component", () => {
    expect(typeof YouTubeShowcase).toBe("function");
  });

  it.concurrent("renders marquee when feature flag is enabled and videos exist", () => {
    const el = YouTubeShowcase({ videos: mockVideos });
    expect(el).not.toBeNull();
  });

  it.concurrent("returns null when videos array is empty", () => {
    const el = YouTubeShowcase({ videos: [] });
    expect(el).toBeNull();
  });
});
