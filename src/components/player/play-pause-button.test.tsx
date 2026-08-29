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

vi.mock("@/hooks/use-audio", () => ({
  useAudioPlayback: () => ({
    isPlaying: false,
    togglePlay: vi.fn(),
  }),
}));

describe.concurrent("src/components/player/play-pause-button.tsx suite", () => {
  it.concurrent("renders PlayPauseButton component", async () => {
    const { PlayPauseButton } = await import("./play-pause-button");
    const tree = PlayPauseButton();
    expect(tree).toBeDefined();
  });
});
