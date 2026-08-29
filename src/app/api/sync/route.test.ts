import { describe, expect, it } from "vitest";

process.env["SYNC_RESOURCE"] = "sync.zip";

describe.concurrent("src/app/api/sync/route.ts suite", () => {
  it.concurrent("loads route module without crashing", async () => {
    const mod = await import("./route");
    expect(mod).toBeDefined();
  });
});

