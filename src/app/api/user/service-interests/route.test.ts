import { describe, expect, it } from "vitest";

describe.concurrent("src/app/api/user/service-interests/route.ts suite", () => {
  it.concurrent("loads route module without crashing", async () => {
    const mod = await import("./route");
    expect(mod).toBeDefined();
  });
});
