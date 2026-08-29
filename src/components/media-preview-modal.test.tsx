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

describe.concurrent("src/components/media-preview-modal.tsx suite", () => {
  it.concurrent("resolves youtube, drive, and standard asset urls", async () => {
    const { getMaterialIframeUrl, getMaterialDirectUrl } = await import(
      "./media-preview-modal"
    );

    expect(
      getMaterialIframeUrl({
        id: 1,
        name: "Video",
        uri: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      } as any),
    ).toContain("youtube-nocookie.com/embed/dQw4w9WgXcQ");

    expect(
      getMaterialIframeUrl({
        id: 2,
        name: "Doc",
        uri: "1A2B3C4D5E6F7G8H9I0J",
      } as any),
    ).toContain("drive.google.com/file/d/1A2B3C4D5E6F7G8H9I0J/preview");

    expect(
      getMaterialDirectUrl({
        id: 3,
        name: "PDF",
        uri: "https://test.com/book.pdf",
      } as any),
    ).toBe("https://test.com/book.pdf");
  });
});
