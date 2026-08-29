import { describe, expect, it } from "vitest";
import { getSupabaseServerClient } from "./supabase-server";

describe.concurrent("supabase-server suite", () => {
  it.concurrent("returns server client instance", () => {
    const client = getSupabaseServerClient();
    expect(client).toBeDefined();
    expect(typeof client.from).toBe("function");
  });
});
