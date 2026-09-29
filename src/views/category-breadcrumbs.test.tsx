import { describe, expect, it, vi } from "vitest";

// Common UI and hook mocks to enable shallow/functional component execution
vi.mock("@/hooks/use-is-mobile", () => ({ useIsMobile: () => false }));
vi.mock("@/hooks/use-online-status", () => ({ useOnlineStatus: () => true }));
vi.mock("@/hooks/use-categories", () => ({
  useCategories: () => ({
    data: [
      {
        id: 1,
        name: "Spiritual Discourses",
        url_path: "spiritual-discourses",
        path: "",
      },
      {
        id: 2,
        name: "Bhagavad Gita",
        url_path: "spiritual-discourses.bg",
        path: "1",
      },
    ],
  }),
}));
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
  it.concurrent("renders CategoryBreadcrumbs without category", async () => {
    const { CategoryBreadcrumbs } = await import("./category-breadcrumbs");
    const tree = CategoryBreadcrumbs({});
    expect(tree).toBeDefined();
  });

  it.concurrent("renders CategoryBreadcrumbs with category and ancestors", async () => {
    const { CategoryBreadcrumbs } = await import("./category-breadcrumbs");
    const tree = CategoryBreadcrumbs({
      category: {
        id: 2,
        name: "Bhagavad Gita",
        url_path: "spiritual-discourses.bg",
        path: "1",
        description: null,
        img_id: null,
        parent_id: 1,
        allowed_roles: [],
        order_ind: 0,
      } as any,
    });
    expect(tree).toBeDefined();
  });
});
