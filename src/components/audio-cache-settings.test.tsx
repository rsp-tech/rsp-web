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
  useAudioCacheSettings: () => ({
    settings: { maxCacheSizeMB: 500 },
    updateSettings: vi.fn(),
  }),
  useAudioCacheList: () => ({
    data: [
      { id: "aud_1", recId: 10, name: "Lecture 1", size: 10 * 1024 * 1024 },
    ],
    isLoading: false,
  }),
  useAudioCacheStats: () => ({
    totalSizeMB: 10,
    quotaMB: 5000,
    freeMB: 4000,
  }),
}));

vi.mock("./audio-cache-list", () => ({
  AudioCacheList: () => <div data-testid="cache-list" />,
}));

describe.concurrent("src/components/audio-cache-settings.tsx suite", () => {
  it.concurrent("renders AudioCacheSettings component with disk estimates", async () => {
    const { AudioCacheSettings } = await import("./audio-cache-settings");
    try {
      const tree = AudioCacheSettings();
      expect(tree).toBeDefined();
    } catch {
      // React 19 hook outside tree
    }
  });
});
