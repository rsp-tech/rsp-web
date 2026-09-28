import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { axiomLogger, sendAxiomLog } from "./axiom-logger";

describe("axiom-logger suite", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv, AXIOM_TOKEN: "test-token" };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("sends structured log event with service: rsp-web to Axiom ingest API", async () => {
    let capturedUrl = "";
    let capturedOptions: RequestInit | undefined;

    vi.spyOn(globalThis, "fetch").mockImplementation((url, options) => {
      capturedUrl = String(url);
      capturedOptions = options;
      return Promise.resolve(new Response(JSON.stringify({ ingested: 1 })));
    });

    axiomLogger.info("User query processed", {
      query_id: "q_123",
      category: "spiritual",
    });

    expect(capturedUrl).toBe("https://api.axiom.co/v1/datasets/rsp/ingest");
    expect(capturedOptions?.method).toBe("POST");
    expect(
      (capturedOptions?.headers as Record<string, string>)?.["Authorization"],
    ).toBe("Bearer test-token");

    const body = JSON.parse(capturedOptions?.body as string);
    expect(Array.isArray(body)).toBe(true);
    expect(body[0]).toMatchObject({
      service: "rsp-web",
      level: "info",
      message: "User query processed",
      query_id: "q_123",
      category: "spiritual",
    });
    expect(body[0]._time).toBeDefined();
  });

  it("uses custom AXIOM_DATASET if set in environment", async () => {
    process.env["AXIOM_DATASET"] = "custom-dataset";
    let capturedUrl = "";

    vi.spyOn(globalThis, "fetch").mockImplementation((url) => {
      capturedUrl = String(url);
      return Promise.resolve(new Response(JSON.stringify({ ingested: 1 })));
    });

    axiomLogger.warn("Disk threshold reached");
    expect(capturedUrl).toBe(
      "https://api.axiom.co/v1/datasets/custom-dataset/ingest",
    );
  });

  it("serializes Error instances in attributes", async () => {
    let capturedBody = "";

    vi.spyOn(globalThis, "fetch").mockImplementation((_url, options) => {
      capturedBody = options?.body as string;
      return Promise.resolve(new Response(JSON.stringify({ ingested: 1 })));
    });

    const testError = new Error("DB Connection Failed");
    axiomLogger.error("Failed to execute sync", { error: testError });

    const body = JSON.parse(capturedBody);
    expect(body[0]).toMatchObject({
      service: "rsp-web",
      level: "error",
      message: "Failed to execute sync",
      error_message: "DB Connection Failed",
      error_name: "Error",
    });
    expect(body[0].error_stack).toBeDefined();
  });

  it("does not fetch if AXIOM_TOKEN is missing", async () => {
    delete process.env["AXIOM_TOKEN"];
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    axiomLogger.info("Should not send");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not send if window is defined (client-side guard)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    delete process.env["VITEST"];

    try {
      sendAxiomLog("info", "Client-side attempt");
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      process.env["VITEST"] = "true";
    }
  });
});
