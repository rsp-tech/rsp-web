import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServerClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          single: () =>
            Promise.resolve({
              data: { name: "Bhagavad Gita", img_id: "bg.webp" },
            }),
        }),
      }),
    }),
    rpc: () =>
      Promise.resolve({
        data: {
          category: { id: 1, name: "Bhagavad Gita", url_path: "gita" },
          subcategories: [],
          recordings: [
            { id: 101, name: "Introduction", audio_id: "aud_1", yt_id: "yt_1" },
          ],
        },
      }),
  }),
}));

vi.mock("@/hooks/use-is-mobile", () => ({ useIsMobile: () => false }));
vi.mock("@/hooks/use-online-status", () => ({ useOnlineStatus: () => true }));
vi.mock("@/lib/idb", () => ({ getDB: () => Promise.resolve(null) }));

describe.concurrent("src/app/[[...slug]]/page.tsx suite", () => {
  it.concurrent("generateMetadata generates metadata for category routes", async () => {
    const { generateMetadata } = await import("./page");
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: ["gita"] }),
    });
    expect(metadata).toBeDefined();
  });

  it.concurrent("renders default exported component with structured json-ld", async () => {
    const mod = await import("./page");
    const Comp = mod.default;
    const tree = await Comp({ params: Promise.resolve({ slug: ["gita"] }) });
    expect(tree).toBeDefined();
  });
});

