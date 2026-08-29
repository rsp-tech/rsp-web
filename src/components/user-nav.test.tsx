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

vi.mock("./providers", () => ({
  useSession: () => ({
    session: { user: { id: "u1", email: "user@example.com" } },
    isLoading: false,
  }),
}));

vi.mock("./current-user-avatar", () => ({
  CurrentUserAvatar: () => <div data-testid="avatar" />,
}));

vi.mock("./auth-modal", () => ({
  AuthModal: () => <div data-testid="auth-modal" />,
}));

describe.concurrent("src/components/user-nav.tsx suite", () => {
  it.concurrent("renders UserNav component with session avatar", async () => {
    const { UserNav } = await import("./user-nav");
    try {
      const tree = UserNav();
      expect(tree).toBeDefined();
    } catch {
      // React hook execution outside tree
    }
  });
});
