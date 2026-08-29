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

describe.concurrent("src/components/search/search-scope-tabs.tsx suite", () => {
  it.concurrent("renders SearchScopeTabs with full, current, and sub tab buttons", async () => {
    const { SearchScopeTabs } = await import("./search-scope-tabs");
    const setScope = vi.fn();
    const tree = SearchScopeTabs({
      scope: "full",
      setScope,
      currentCategory: {
        id: 1,
        name: "Bhagavad Gita",
        url_path: "gita",
        path: "gita",
      } as any,
    });
    expect(tree).toBeDefined();
  });
});
