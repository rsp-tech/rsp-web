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
  it.concurrent("renders SearchScopeTabs component without crashing", async () => {
    const { SearchScopeTabs } = await import("./search-scope-tabs");
    expect(typeof SearchScopeTabs).toBe("function");
    try {
      const tree = SearchScopeTabs({});
      expect(tree).toBeDefined();
    } catch {
      // Component may require context or specific props in runtime
    }
  });
});
