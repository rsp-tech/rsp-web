import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: (...args: unknown[]) => unknown) => fn,
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

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
vi.mock("@/app/api/sync/delta-service", () => ({
  getCachedUrlPaths: () => Promise.resolve(["gita"]),
}));

describe.concurrent("src/app/[[...slug]]/page.tsx suite", () => {
  it.concurrent("generateMetadata generates metadata for library category routes", async () => {
    const { generateMetadata } = await import("./page");
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: ["library", "gita"] }),
    });
    expect(metadata).toBeDefined();
  });

  it.concurrent("generateMetadata generates metadata for library root", async () => {
    const { generateMetadata } = await import("./page");
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug: ["library"] }),
    });
    expect(metadata.title).toContain("Spiritual Library");
  });

  it.concurrent("renders default exported component with structured json-ld under /library", async () => {
    const mod = await import("./page");
    const Comp = mod.default;
    const tree = await Comp({
      params: Promise.resolve({ slug: ["library", "gita"] }),
    });
    expect(tree).toBeDefined();
  });
});
