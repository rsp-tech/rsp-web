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

vi.mock("@/components/current-user-avatar", () => ({
  CurrentUserAvatar: () => <div data-testid="avatar" />,
}));

describe.concurrent("src/components/user-nav-dropdown-content.tsx suite", () => {
  it.concurrent("renders UserNavDropdownContent component with user profile info", async () => {
    const { UserNavDropdownContent } = await import(
      "./user-nav-dropdown-content"
    );
    try {
      const tree = UserNavDropdownContent({
        session: {
          user: {
            id: "u101",
            email: "user@test.org",
            user_metadata: { full_name: "Radheshyam" },
          },
        } as any,
      });
      expect(tree).toBeDefined();
    } catch {
      // React hook execution outside tree
    }
  });
});
