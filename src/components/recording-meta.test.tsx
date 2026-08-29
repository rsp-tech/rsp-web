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

vi.mock("@/hooks/use-metadata", () => ({
  useMetadata: () => ({
    speakers: [{ id: 1, name: "HG Radheshyamdas" }],
    languages: [{ id: 1, name: "English" }],
    venues: [{ id: 1, name: "Pune Temple" }],
    events: [{ id: 1, name: "Sunday Feast", short_name: "Feast" }],
    isPending: false,
  }),
}));

vi.mock("@/hooks/use-categories", () => ({
  useCategories: () => ({
    data: [{ id: 1, name: "Gita", url_path: "gita" }],
  }),
}));

describe.concurrent("src/components/recording-meta.tsx suite", () => {
  it.concurrent("renders RecordingMeta component with enriched metadata tags", async () => {
    const { RecordingMeta } = await import("./recording-meta");
    const tree = RecordingMeta({
      rec: {
        id: 101,
        name: "Bhagavad Gita Intro",
        speaker_ids: [1],
        lang_ids: [1],
        venues_id: 1,
        event_id: 1,
        category_id: 1,
        materials: [{ id: "m1", name: "Slides.pdf" } as any],
      } as any,
      showLink: true,
    });
    expect(tree).toBeDefined();
  });
});
