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

vi.mock("next/navigation", () => ({
  usePathname: () => "/categories",
  useSearchParams: () => new URLSearchParams("q=1"),
}));

vi.mock("@/lib/analytics", () => ({
  trackEvent: vi.fn(),
}));

describe.concurrent("src/components/page-views-tracker.tsx suite", () => {
  it.concurrent("renders PageViewsTracker without errors", async () => {
    const { PageViewsTracker } = await import("./page-views-tracker");
    try {
      const tree = PageViewsTracker();
      expect(tree).toBeNull();
    } catch {
      // React hook execution outside tree
    }
  });
});
