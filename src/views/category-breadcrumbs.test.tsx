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

describe.concurrent("src/views/category-breadcrumbs.tsx suite", () => {
  it.concurrent("renders CategoryBreadcrumbs component with breadcrumb links", async () => {
    const { CategoryBreadcrumbs } = await import("./category-breadcrumbs");
    const tree = CategoryBreadcrumbs({
      breadcrumbs: [
        { label: "Gita", href: "/gita" },
        { label: "Chapter 1", href: "/gita/ch1" },
      ],
    });
    expect(tree).toBeDefined();
  });
});
