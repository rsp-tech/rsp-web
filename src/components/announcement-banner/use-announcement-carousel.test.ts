import { describe, expect, it, vi } from "vitest";

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useState: (initial: any) => {
      const val = typeof initial === "function" ? initial() : initial;
      return [val, vi.fn()];
    },
    useEffect: vi.fn(),
  };
});

vi.mock("@/hooks/use-reduced-motion", () => ({
  useReducedMotion: () => false,
}));

import { useAnnouncementCarousel } from "./use-announcement-carousel";

describe.concurrent("useAnnouncementCarousel hook suite", () => {
  it.concurrent("initializes carousel state properly", () => {
    const hook = useAnnouncementCarousel({ total: 3 });
    expect(hook.currentIndex).toBe(0);
    expect(hook.isPaused).toBe(false);
    expect(typeof hook.handlePrev).toBe("function");
    expect(typeof hook.handleNext).toBe("function");
    expect(typeof hook.handleTouchCancel).toBe("function");
  });

  it.concurrent("handles touch cancel without remaining stuck in paused state", () => {
    const hook = useAnnouncementCarousel({ total: 3 });
    expect(() => hook.handleTouchCancel()).not.toThrow();
  });
});
