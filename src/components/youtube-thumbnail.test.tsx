import { describe, expect, it, vi } from "vitest";

vi.mock("react", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react")>();
  return {
    ...actual,
    useState: (initial: any) => [initial, vi.fn()],
  };
});

import { YouTubeThumbnail } from "./youtube-thumbnail";

describe.concurrent("src/components/youtube-thumbnail.tsx suite", () => {
  it.concurrent("renders image with primary fallback URL", () => {
    const el = YouTubeThumbnail({
      videoId: "36a1v_g-Cgs",
      title: "Mastering the Mind",
    });
    expect(el).toBeDefined();
    expect(el.props.src).toContain("36a1v_g-Cgs");
  });

  it.concurrent("uses initialUrl when supplied", () => {
    const customUrl = "https://custom-cdn.example.com/thumb.jpg";
    const el = YouTubeThumbnail({
      videoId: "36a1v_g-Cgs",
      initialUrl: customUrl,
      title: "Mastering the Mind",
    });
    expect(el.props.src).toBe(customUrl);
  });
});
