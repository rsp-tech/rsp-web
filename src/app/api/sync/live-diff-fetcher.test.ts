import { describe, expect, it, vi } from "vitest";
import { STORE } from "@/constants";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
}));

const mockQuery: any = {
  order: () => mockQuery,
  gt: () => mockQuery,
  contains: () => mockQuery,
  not: () => mockQuery,
  then: (resolve: any) =>
    resolve({
      data: [{ id: 2, name: "New Cat", updated_at: "2026-01-05T00:00:00Z" }],
      error: null,
    }),
};

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServerClient: () => ({
    from: () => ({
      select: () => mockQuery,
    }),
  }),
}));



describe.concurrent("api/sync/live-diff-fetcher suite", () => {
  it.concurrent("getCachedLiveDiff queries rows modified after watermark", async () => {
    const { getCachedLiveDiff } = await import("./live-diff-fetcher");
    const diffs = await getCachedLiveDiff(STORE.CATEGORIES, "2026-01-01T00:00:00Z");
    expect(diffs.length).toBeGreaterThan(0);
    expect(diffs[0]?.["id"]).toBe(2);
  });
});
