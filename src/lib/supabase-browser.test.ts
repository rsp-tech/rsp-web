import { describe, expect, it } from "vitest";
import { getSupabaseClient } from "./supabase-browser";

describe.concurrent("supabase-browser suite", () => {
  it.concurrent("returns client instance", () => {
    const client = getSupabaseClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe("function");
  });
});
