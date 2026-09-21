import { describe, expect, it, vi } from "vitest";
import { STORE } from "@/constants";

vi.mock("next/cache", () => ({
  unstable_cache: (fn: any) => fn,
}));

let mockError: { message: string } | null = null;
let mockData: any = [
  { id: 2, name: "New Cat", updated_at: "2026-01-05T00:00:00Z" },
];

const mockQuery: any = {
  order: () => mockQuery,
  gt: () => mockQuery,
  contains: () => mockQuery,
  not: () => mockQuery,
  // biome-ignore lint/suspicious/noThenProperty: ok
  then: (resolve: any) =>
    resolve({
      data: mockData,
      error: mockError,
    }),
};

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServerClient: () => ({
    from: () => ({
      select: () => mockQuery,
    }),
  }),
}));

describe("api/sync/live-diff-fetcher suite", () => {
  it("getCachedLiveDiff queries rows modified after watermark", async () => {
    const { getCachedLiveDiff } = await import("./live-diff-fetcher");
    const diffs = await getCachedLiveDiff(
      STORE.CATEGORIES,
      "2026-01-01T00:00:00Z",
    );
    expect(diffs.length).toBeGreaterThan(0);
    expect(diffs[0]?.["id"]).toBe(2);
  });

  it("throws an error when Supabase query fails", async () => {
    mockError = { message: "Database connection failed" };
    mockData = null;
    const { getCachedLiveDiff } = await import("./live-diff-fetcher");
    await expect(
      getCachedLiveDiff(STORE.CATEGORIES, "2026-01-01T00:00:00Z"),
    ).rejects.toThrow(
      "Failed to fetch live diff for categories: Database connection failed",
    );
    mockError = null;
    mockData = [{ id: 2, name: "New Cat", updated_at: "2026-01-05T00:00:00Z" }];
  });
});
