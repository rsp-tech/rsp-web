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
  usePathname: () => "/gita",
  redirect: vi.fn(),
}));

vi.mock("@/hooks/use-category-page", () => ({
  useCategoryPage: () => ({
    data: {
      category: { id: 1, name: "Bhagavad Gita", url_path: "gita" },
      subcategories: [{ id: 2, name: "Chapter 1", url_path: "gita/ch1" }],
      recordings: [{ id: 10, name: "Gita Class 1" }],
    },
    isPending: false,
    error: null,
    refetch: vi.fn(),
  }),
}));

describe.concurrent("src/views/client-shell.tsx suite", () => {
  it.concurrent("renders ClientShell category page view", async () => {
    const { ClientShell } = await import("./client-shell");
    const tree = ClientShell({});
    expect(tree).toBeDefined();
  });
});

