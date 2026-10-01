import { describe, expect, it, vi } from "vitest";
import { STORE } from "@/constants";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  usePathname: () => "/gita",
}));

vi.mock("@/hooks/use-search", () => ({
  useSearch: () => ({
    searchAll: vi.fn().mockResolvedValue([
      {
        target: STORE.RECORDINGS,
        hits: [{ id: "101", name: "Gita 1.1" }],
      },
    ]),
  }),
}));

vi.mock("./use-categories", () => ({
  useCategories: () => ({
    data: [{ id: 1, name: "Bhagavad Gita", url_path: "gita" }],
  }),
}));

vi.mock("./use-search-settings", () => ({
  useSearchSettings: () => ({
    effectiveTolerance: 1,
    tolerance: 1,
    setTolerance: vi.fn(),
    searchFields: ["name", "speaker_names", "event_name", "venue_name"],
    setSearchFields: vi.fn(),
    toggleSearchField: vi.fn(),
    exactMatch: false,
    setExactMatch: vi.fn(),
  }),
}));

vi.mock("@/lib/idb", () => ({
  getDB: () =>
    Promise.resolve({
      getFromIndex: () =>
        Promise.resolve({ id: 1, name: "Bhagavad Gita", url_path: "gita" }),
      get: (_store: string, id: number) =>
        Promise.resolve({
          id,
          name: "Gita 1.1",
          category_id: 1,
          url_path: "gita",
        }),
    }),
}));

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useState: (init: any) => [
      typeof init === "function" ? init() : init,
      vi.fn(),
    ],
    useEffect: vi.fn(),
    useCallback: (fn: any) => fn,
    useRef: () => ({ current: null }),
  };
});

import { useSearchBar } from "./use-search-bar";

describe.concurrent("use-search-bar suite", () => {
  it.concurrent("handles selection of category, recording, and material", () => {
    const hook = useSearchBar();
    hook.handleSelectCategory({
      id: 1,
      name: "Gita",
      url_path: "gita",
      path: "gita",
    } as any);
    hook.handleSelectRecording({
      id: 101,
      name: "Gita 1.1",
      category_id: 1,
    } as any);
    hook.handleSelectMaterial({
      id: 201,
      name: "Slide.pdf",
      recording_id: 101,
      recording: { id: 101 } as any,
      category: { id: 1, url_path: "gita" } as any,
    } as any);
    expect(hook.term).toBe("");
  });
});
