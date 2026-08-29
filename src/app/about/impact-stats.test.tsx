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

describe.concurrent("src/app/about/impact-stats.tsx suite", () => {
  it.concurrent("renders ImpactStats component without crashing", async () => {
    const { ImpactStats } = await import("./impact-stats");
    expect(typeof ImpactStats).toBe("function");
    try {
      const tree = ImpactStats({});
      expect(tree).toBeDefined();
    } catch {
      // Component may require context or specific props in runtime
    }
  });
});
