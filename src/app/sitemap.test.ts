import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServerClient: () => ({
    from: () => ({
      select: () => ({
        neq: () =>
          Promise.resolve({
            data: [
              { url_path: "gita.ch1", updated_at: "2026-01-01T00:00:00Z" },
            ],
            error: null,
          }),
      }),
    }),
  }),
}));

import sitemap from "./sitemap";

describe.concurrent("app/sitemap suite", () => {
  it.concurrent("generates full sitemap entry list", async () => {
    const entries = await sitemap();
    expect(entries.length).toBeGreaterThan(3);
    expect(entries.some((e) => e.url.includes("gita/ch1"))).toBe(true);
  });
});
