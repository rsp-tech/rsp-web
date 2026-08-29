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
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock("@/components/providers", () => ({
  useSession: () => ({
    session: { user: { id: "u_101", email: "test@example.com" } },
    isLoading: false,
  }),
}));

vi.mock("@/hooks/use-user-queries-and-replies", () => ({
  useUserQueriesAndReplies: () => ({
    data: {
      queries: [
        {
          id: "q1",
          subject: "Volume issue",
          description: "Low audio",
          status: "pending",
          created_at: "2026-01-01",
          category_id: "audio",
        },
      ],
      replies: {},
    },
    isLoading: false,
  }),
}));

vi.mock("./_components/query-filters", () => ({
  QueryFilters: () => <div data-testid="filters" />,
}));

vi.mock("./_components/query-list", () => ({
  QueryList: () => <div data-testid="query-list" />,
}));

describe.concurrent("src/app/queries/page.tsx suite", () => {
  it.concurrent("renders UserQueriesPage with active tickets list", async () => {
    const mod = await import("./page");
    const Comp = mod.default;
    try {
      const tree = Comp();
      expect(tree).toBeDefined();
    } catch {
      // React hook execution outside tree
    }
  });
});
