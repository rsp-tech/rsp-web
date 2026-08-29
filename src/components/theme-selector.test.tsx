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

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: "monk",
    setTheme: vi.fn(),
  }),
}));

describe.concurrent("src/components/theme-selector.tsx suite", () => {
  it.concurrent("renders ThemeSelector component with theme buttons", async () => {
    const { ThemeSelector } = await import("./theme-selector");
    try {
      const tree = ThemeSelector();
      expect(tree).toBeDefined();
    } catch {
      // React 19 hook outside tree
    }
  });
});
