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
  useSearchParams: () => ({
    get: (k: string) => (k === "q" ? "101" : null),
  }),
}));

vi.mock("./recording-card", () => ({
  RecordingCard: () => <div data-testid="rec-card" />,
}));

vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useMemo: (fn: any) => fn(),
    useEffect: (fn: any) => fn(),
    useCallback: (fn: any) => fn,
    useRef: () => ({ current: null }),
  };
});

describe.concurrent("src/components/recording-cards.tsx suite", () => {
  it.concurrent("renders RecordingCards component with recording list", async () => {
    const { RecordingCards } = await import("./recording-cards");
    const tree = RecordingCards({
      sortedRecordings: [
        { id: 101, name: "Lecture 1", materials: [] } as any,
        { id: 102, name: "Lecture 2", materials: [] } as any,
      ],
    });
    expect(tree).toBeDefined();
  });
});
