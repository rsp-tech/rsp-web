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

describe.concurrent("src/components/category-list.tsx suite", () => {
  it.concurrent("renders CategoryList with empty and populated lists", async () => {
    const { CategoryList } = await import("./category-list");

    const emptyTree = CategoryList({ categories: [] });
    expect(emptyTree).toBeDefined();

    const populatedTree = CategoryList({
      categories: [
        {
          id: 1,
          name: "Bhagavad Gita",
          url_path: "gita",
          path: "gita",
          order_ind: 1,
        } as any,
        {
          id: 2,
          name: "Srimad Bhagavatam",
          url_path: "sb",
          path: "sb",
          order_ind: 2,
        } as any,
      ],
    });
    expect(populatedTree).toBeDefined();
  });
});
