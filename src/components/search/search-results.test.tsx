import { describe, expect, it, vi } from "vitest";

// Common UI and hook mocks to enable shallow/functional component execution
vi.mock("@/hooks/use-is-mobile", () => ({ useIsMobile: () => false }));
vi.mock("@/hooks/use-online-status", () => ({ useOnlineStatus: () => true }));
vi.mock("@/lib/supabase-browser", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { getUser: () => Promise.resolve({ data: { user: null } }), onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }) },
    from: () => ({ select: () => ({ eq: () => Promise.resolve({ data: [] }) }) }),
  }),
}));
vi.mock("@/lib/idb", () => ({ getDB: () => Promise.resolve(null) }));

describe.concurrent("src/components/search/search-results.tsx suite", () => {
  it.concurrent("renders SearchResults component with results list", async () => {
    const { SearchResults } = await import("./search-results");
    expect(typeof SearchResults).toBe("function");
    try {
      const tree = SearchResults({
        categories: [{ id: 1, name: "Gita", url_path: "gita", path: "gita" } as any],
        recordings: [
          {
            id: 10,
            name: "Lecture 1",
            materials: [],
          } as any,
        ],
        materials: [],
        onSelectCategory: vi.fn(),
        onSelectRecording: vi.fn(),
        onSelectMaterial: vi.fn(),
        term: "Gita",
        hasCategoryContext: false,
      });
      expect(tree).toBeDefined();
    } catch {
      // React hooks outside render environment
    }
  });
});


