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

vi.mock("@/lib/idb", () => ({
  getDB: () =>
    Promise.resolve({
      getFromIndex: () =>
        Promise.resolve({ id: 1, name: "Bhagavad Gita", url_path: "gita" }),
      get: (_store: string, id: number) =>
        Promise.resolve({ id, name: "Gita 1.1", category_id: 1 }),
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
  it.concurrent("useSearchBar initializes with default state and getters", () => {
    const hook = useSearchBar();
    expect(hook.term).toBe("");
    expect(hook.scope).toBe("full");
    expect(typeof hook.setTerm).toBe("function");
    expect(typeof hook.setScope).toBe("function");
    expect(typeof hook.setFilters).toBe("function");
  });
});
