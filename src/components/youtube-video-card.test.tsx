import { describe, expect, it, vi } from "vitest";
import type { YouTubeVideo } from "@/lib/youtube-service";
import { YouTubeVideoCard } from "./youtube-video-card";

const mockSetYt = vi.fn();
vi.mock("@/hooks/use-video", () => ({
  useVideo: () => ({
    setYt: mockSetYt,
  }),
}));

const mockVideo: YouTubeVideo = {
  id: "test-vid-1",
  title: "Test Video Title",
  publishedAt: "2026-01-01",
  thumbnailUrl: "https://example.com/thumb.jpg",
  url: "https://youtube.com/watch?v=test-vid-1",
  viewCount: 1000,
  viewCountFormatted: "1K views",
};

describe.concurrent("YouTubeVideoCard suite", () => {
  it.concurrent("exports YouTubeVideoCard component", () => {
    expect(typeof YouTubeVideoCard).toBe("function");
  });

  it("renders card element with default props", () => {
    const el = YouTubeVideoCard({ video: mockVideo });
    expect(el).not.toBeNull();
  });

  it("triggers setYt with video id and title by default when onClick omitted", () => {
    mockSetYt.mockClear();
    const el = YouTubeVideoCard({ video: mockVideo });
    el.props.onClick();
    expect(mockSetYt).toHaveBeenCalledWith(mockVideo.id, mockVideo.title);
  });
});
