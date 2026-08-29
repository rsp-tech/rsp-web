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

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useEffect: (fn: any) => fn(),
  };
});

describe.concurrent("src/components/pwa-register.tsx suite", () => {
  it.concurrent("renders PwaRegister component and handles service worker", async () => {
    (globalThis as any).navigator.serviceWorker = {
      register: vi.fn().mockResolvedValue({ scope: "/" }),
      getRegistrations: vi
        .fn()
        .mockResolvedValue([
          { scope: "/", unregister: vi.fn().mockResolvedValue(true) },
        ]),
    };

    const { PwaRegister } = await import("./pwa-register");
    const tree = PwaRegister();
    expect(tree).toBeNull();
  });
});
