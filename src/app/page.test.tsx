import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/supabase-server", () => ({
  getSupabaseServerClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => Promise.resolve({ data: [] }),
        in: () => Promise.resolve({ data: [] }),
      }),
    }),
  }),
}));

describe.concurrent("home page suite", () => {
  it.concurrent("exports Home page component", async () => {
    const HomePage = (await import("./[[...slug]]/page")).default;
    expect(typeof HomePage).toBe("function");
  });

  it.concurrent("exports generateMetadata function", async () => {
    const { generateMetadata } = await import("./[[...slug]]/page");
    expect(typeof generateMetadata).toBe("function");
  });
});
