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

vi.mock("next/navigation", () => ({
  usePathname: () => "/about",
}));

describe.concurrent("src/components/page-transition.tsx suite", () => {
  it.concurrent("renders PageTransition component with child content", async () => {
    const { PageTransition } = await import("./page-transition");
    const tree = PageTransition({ children: "Test Content" });
    expect(tree).toBeDefined();
  });
});

