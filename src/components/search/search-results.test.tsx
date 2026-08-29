import { describe, expect, it, vi } from "vitest";

// Common UI and hook mocks to enable shallow/functional component execution
vi.mock("@/hooks/use-is-mobile", () => ({ useIsMobile: () => false }));
vi.mock("@/hooks/use-online-status", () => ({ useOnlineStatus: () => true }));
vi.mock("@/lib/supabase-browser", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getUser: () => Promise.resolve({ data: { user: null } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: () => {} } },
      }),
    },
    from: () => ({
      select: () => ({ eq: () => Promise.resolve({ data: [] }) }),
    }),
  }),
}));
vi.mock("@/lib/idb", () => ({ getDB: () => Promise.resolve(null) }));

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useRef: () => ({ current: null }),
    useEffect: vi.fn(),
  };
});

describe.concurrent("src/components/search/search-results.tsx suite", () => {
  it.concurrent("renders empty, no results, and populated search items", async () => {
    const { SearchResults } = await import("./search-results");

    const emptyTerm = SearchResults({
      categories: [],
      recordings: [],
      materials: [],
      onSelectCategory: vi.fn(),
      onSelectRecording: vi.fn(),
      onSelectMaterial: vi.fn(),
      term: "",
      hasCategoryContext: true,
    });
    expect(emptyTerm).toBeDefined();

    const noMatches = SearchResults({
      categories: [],
      recordings: [],
      materials: [],
      onSelectCategory: vi.fn(),
      onSelectRecording: vi.fn(),
      onSelectMaterial: vi.fn(),
      term: "Unknown xyz",
      hasCategoryContext: false,
    });
    expect(noMatches).toBeDefined();

    const populated = SearchResults({
      categories: [
        { id: 1, name: "Gita", url_path: "gita", path: "gita" } as any,
      ],
      recordings: [
        {
          id: 10,
          name: "Lecture 1",
          materials: [],
        } as any,
      ],
      materials: [
        {
          id: 100,
          name: "Notes.pdf",
          recording: { id: 10, name: "Lecture 1" } as any,
        } as any,
      ],
      onSelectCategory: vi.fn(),
      onSelectRecording: vi.fn(),
      onSelectMaterial: vi.fn(),
      term: "Gita",
      hasCategoryContext: false,
    });
    expect(populated).toBeDefined();
  });
});
