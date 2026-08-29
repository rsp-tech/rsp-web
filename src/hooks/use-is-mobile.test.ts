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

import { useIsMobile } from "./use-is-mobile";

describe.concurrent("use-is-mobile suite", () => {
  it.concurrent("evaluates window.innerWidth against breakpoint", () => {
    (globalThis as any).window.innerWidth = 500;
    expect(useIsMobile()).toBe(true);

    (globalThis as any).window.innerWidth = 1024;
    expect(useIsMobile()).toBe(false);
  });
});
