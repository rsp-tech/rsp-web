import { describe, expect, it, vi } from "vitest";

(globalThis as any).self = {
  __SW_MANIFEST: [],
  skipWaiting: vi.fn(),
  clients: { claim: vi.fn() },
  addEventListener: vi.fn(),
  registration: { scope: "https://localhost" },
};

describe.concurrent("src/app/sw.ts suite", () => {
  it.concurrent("loads sw module without crashing", async () => {
    const mod = await import("./sw");
    expect(mod).toBeDefined();
  });
});
