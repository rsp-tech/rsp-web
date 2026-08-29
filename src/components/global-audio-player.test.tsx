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

let currentId: string | null = "aud_1";

vi.mock("@/hooks/use-audio", () => ({
  useAudioPlayback: () => ({
    get currentAudioId() {
      return currentId;
    },
  }),
}));

vi.mock("./audio-player-panel", () => ({
  AudioPlayerPanel: () => <div data-testid="player-panel" />,
}));

describe.concurrent("src/components/global-audio-player.tsx suite", () => {
  it.concurrent("renders GlobalAudioPlayer component with active audio", async () => {
    currentId = "aud_123";
    const { GlobalAudioPlayer } = await import("./global-audio-player");
    const tree = GlobalAudioPlayer();
    expect(tree).toBeDefined();
  });
});
