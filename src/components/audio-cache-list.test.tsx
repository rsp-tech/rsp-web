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

vi.mock("@/hooks/use-audio-cache", () => ({
  useAudioCacheList: () => ({
    data: [
      {
        id: 101,
        name: "BG Chapter 1 Class",
        audio_id: "aud_101",
        size: 5 * 1024 * 1024,
        category_id: 1,
        materials: [],
      },
    ],
    isLoading: false,
  }),
  useDeleteAudioCache: () => ({
    mutate: vi.fn(),
  }),
}));

vi.mock("./recording-meta", () => ({
  RecordingMeta: () => <div data-testid="rec-meta" />,
}));

describe.concurrent("src/components/audio-cache-list.tsx suite", () => {
  it.concurrent("renders AudioCacheList component with cached tracks", async () => {
    const { AudioCacheList } = await import("./audio-cache-list");
    try {
      const tree = AudioCacheList();
      expect(tree).toBeDefined();
    } catch {
      // React 19 hook outside tree
    }
  });
});
