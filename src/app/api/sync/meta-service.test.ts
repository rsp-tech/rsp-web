import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServerClient: () => ({
    from: () => ({
      select: () =>
        Promise.resolve({
          data: [{ id: "categories", updated_at: "2026-01-01T00:00:00Z" }],
          error: null,
        }),
    }),
  }),
}));

describe.concurrent("api/sync/meta-service suite", () => {
  it.concurrent("getCachedSyncMeta returns mapping of table updated_at timestamps", async () => {
    const { getCachedSyncMeta } = await import("./meta-service");
    const meta = await getCachedSyncMeta();
    expect(meta["categories"]).toBe("2026-01-01T00:00:00Z");
  });
});
