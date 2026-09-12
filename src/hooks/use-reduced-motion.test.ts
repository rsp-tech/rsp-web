import { describe, expect, it, vi } from "vitest";

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useSyncExternalStore: (
      subscribe: any,
      getSnapshot: any,
      _getServerSnapshot: any,
    ) => {
      const unsub = subscribe(vi.fn());
      unsub();
      return getSnapshot();
    },
  };
});

import { useReducedMotion } from "./use-reduced-motion";

describe.concurrent("useReducedMotion suite", () => {
  it.concurrent("returns false when prefers-reduced-motion does not match", () => {
    (globalThis as any).window.matchMedia = vi.fn().mockReturnValue({
      matches: false,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    expect(useReducedMotion()).toBe(false);
  });

  it.concurrent("returns true when prefers-reduced-motion matches", () => {
    (globalThis as any).window.matchMedia = vi.fn().mockReturnValue({
      matches: true,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    expect(useReducedMotion()).toBe(true);
  });
});
