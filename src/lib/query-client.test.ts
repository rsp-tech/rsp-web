import { describe, expect, it } from "vitest";
import { getQueryClient } from "./query-client";

describe.concurrent("query-client singleton suite", () => {
  it.concurrent("returns QueryClient with strict offline-first cache settings", () => {
    const q1 = getQueryClient();
    const q2 = getQueryClient();
    expect(q1).toBe(q2);
    expect(q1.getDefaultOptions().queries?.retry).toBe(false);
    expect(q1.getDefaultOptions().queries?.refetchOnWindowFocus).toBe(false);
    expect(q1.getDefaultOptions().queries?.networkMode).toBe("always");
  });
});
