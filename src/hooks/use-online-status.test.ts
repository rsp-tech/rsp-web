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

import { useOnlineStatus } from "./use-online-status";

describe.concurrent("use-online-status suite", () => {
  it.concurrent("returns true when navigator is online", () => {
    Object.defineProperty(globalThis.navigator, "onLine", {
      value: true,
      configurable: true,
    });
    expect(useOnlineStatus()).toBe(true);

    Object.defineProperty(globalThis.navigator, "onLine", {
      value: false,
      configurable: true,
    });
    expect(useOnlineStatus()).toBe(false);
  });
});
