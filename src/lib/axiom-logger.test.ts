import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  axiomLogger,
  isSensitiveKey,
  logApiRequest,
  safeDecodeUri,
  scheduleTask,
  sendAxiomLog,
  serializeError,
  toSnakeCase,
  withApiLogging,
} from "./axiom-logger";

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

    await axiomLogger.info("User query processed", {
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
      event: "app.info",
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

    await axiomLogger.warn("Disk threshold reached");
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
    await axiomLogger.error("Failed to execute sync", { error: testError });

    const body = JSON.parse(capturedBody);
    expect(body[0]).toMatchObject({
      service: "rsp-web",
      level: "error",
      event: "app.error",
      message: "Failed to execute sync",
      error_message: "DB Connection Failed",
      error_name: "Error",
    });
    expect(body[0].error_stack).toBeDefined();
  });

  it("does not fetch if AXIOM_TOKEN is missing", async () => {
    delete process.env["AXIOM_TOKEN"];
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    await axiomLogger.info("Should not send");
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("does not send if window is defined (client-side guard)", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    delete process.env["VITEST"];

    try {
      await sendAxiomLog("info", "Client-side attempt");
      expect(fetchSpy).not.toHaveBeenCalled();
    } finally {
      process.env["VITEST"] = "true";
    }
  });

  it("standardizes attribute keys to snake_case", async () => {
    let capturedBody = "";
    vi.spyOn(globalThis, "fetch").mockImplementation((_url, options) => {
      capturedBody = options?.body as string;
      return Promise.resolve(new Response(JSON.stringify({ ingested: 1 })));
    });

    await axiomLogger.info("Operation completed", {
      userId: "u123",
      targetResource: "sync.zip",
      durationMs: 120,
      sinceTimestamp: "2026-01-01",
    });

    const body = JSON.parse(capturedBody);
    expect(body[0]).toMatchObject({
      user_id: "u123",
      target_resource: "sync.zip",
      duration_ms: 120,
      since_timestamp: "2026-01-01",
    });
  });

  it("recursively sanitizes nested objects and redacts nested sensitive keys", async () => {
    let capturedBody = "";
    vi.spyOn(globalThis, "fetch").mockImplementation((_url, options) => {
      capturedBody = options?.body as string;
      return Promise.resolve(new Response(JSON.stringify({ ingested: 1 })));
    });

    await axiomLogger.info("Nested authentication payload", {
      payload: {
        api_token: "super-secret-token",
        userProfile: {
          authToken: "jwt-token-123",
          displayName: "Devotee",
          passwordHash: "secret_hash",
        },
        serviceCredentials: [
          { apiKey: "nested-key-1", serviceName: "storage" },
        ],
      },
    });

    const body = JSON.parse(capturedBody);
    expect(body[0].payload.api_token).toBe("[REDACTED]");
    expect(body[0].payload.user_profile.auth_token).toBe("[REDACTED]");
    expect(body[0].payload.user_profile.password_hash).toBe("[REDACTED]");
    expect(body[0].payload.user_profile.display_name).toBe("Devotee");
    expect(body[0].payload.service_credentials[0].api_key).toBe("[REDACTED]");
    expect(body[0].payload.service_credentials[0].service_name).toBe("storage");
  });

  it("preserves explicit custom event field", async () => {
    let capturedBody = "";
    vi.spyOn(globalThis, "fetch").mockImplementation((_url, options) => {
      capturedBody = options?.body as string;
      return Promise.resolve(new Response(JSON.stringify({ ingested: 1 })));
    });

    await axiomLogger.error("Failed to authenticate user", {
      event: "auth.failed",
      route: "/api/revalidate",
    });

    const body = JSON.parse(capturedBody);
    expect(body[0].event).toBe("auth.failed");
    expect(body[0].message).toBe("Failed to authenticate user");
  });

  it("logs API requests with logApiRequest and decodes percent-encoded slugs", async () => {
    let capturedBody = "";
    vi.spyOn(globalThis, "fetch").mockImplementation((_url, options) => {
      capturedBody = options?.body as string;
      return Promise.resolve(new Response(JSON.stringify({ ingested: 1 })));
    });

    await axiomLogger.request({
      route: "/api/sync",
      method: "GET",
      status: 200,
      duration_ms: 24.5,
      slug: "%D8%A6%D8%A8", // Arabic encoded characters
      page: 1,
      query: "%E0%A4%97%E0%A5%80%E0%A4%A4%E0%A4%BE", // Gita in Devanagari
      cache_status: "HIT",
    });

    const body = JSON.parse(capturedBody);
    expect(body[0]).toMatchObject({
      service: "rsp-web",
      level: "info",
      event: "api.request",
      message: "GET /api/sync 200 (24.5ms)",
      route: "/api/sync",
      method: "GET",
      status: 200,
      duration_ms: 24.5,
      slug: "\u0626\u0628",
      page: 1,
      query: "%E0%A4%97%E0%A5%80%E0%A4%A4%E0%A4%BE",
      cache_status: "HIT",
    });
  });

  it("sets log level to warn for 4xx and error for 5xx in logApiRequest", async () => {
    const bodies: any[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation((_url, options) => {
      bodies.push(JSON.parse(options?.body as string)[0]);
      return Promise.resolve(new Response(JSON.stringify({ ingested: 1 })));
    });

    await logApiRequest({
      route: "/api/queries",
      method: "POST",
      status: 400,
      duration_ms: 5.2,
    });

    await logApiRequest({
      route: "/api/queries",
      method: "POST",
      status: 500,
      duration_ms: 80.1,
    });

    expect(bodies[0].level).toBe("warn");
    expect(bodies[1].level).toBe("error");
  });

  it("wraps API routes with withApiLogging, decodes slug, captures query and dynamic dimensions", async () => {
    let capturedBody = "";
    vi.spyOn(globalThis, "fetch").mockImplementation((_url, options) => {
      capturedBody = options?.body as string;
      return Promise.resolve(new Response(JSON.stringify({ ingested: 1 })));
    });

    const handler = withApiLogging("/api/sync/[id]", async (_req: Request) => {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "x-cache": "HIT" },
      });
    });

    const req = new Request(
      "https://localhost/api/sync/%D8%A6%D8%A8?q=%E0%A4%95%E0%A4%B0%E0%A5%8D%E0%A4%AE&p=2",
    );
    const res = await handler(req);
    expect(res.status).toBe(200);

    const body = JSON.parse(capturedBody);
    expect(body[0]).toMatchObject({
      event: "api.request",
      route: "/api/sync/[id]",
      method: "GET",
      status: 200,
      slug: "\u0626\u0628",
      query: "q=%E0%A4%95%E0%A4%B0%E0%A5%8D%E0%A4%AE&p=2",
      page: 2,
      cache_status: "HIT",
    });
    expect(typeof body[0].duration_ms).toBe("number");
  });

  it("emits exactly ONE api.request event containing error fields on exception (no duplicate api.error)", async () => {
    const capturedBodies: any[] = [];
    vi.spyOn(globalThis, "fetch").mockImplementation((_url, options) => {
      capturedBodies.push(JSON.parse(options?.body as string)[0]);
      return Promise.resolve(new Response(JSON.stringify({ ingested: 1 })));
    });

    const failingHandler = withApiLogging(
      "/api/fail",
      async (_req: Request) => {
        throw new Error("Database query timed out");
      },
    );

    await expect(
      failingHandler(new Request("https://localhost/api/fail")),
    ).rejects.toThrow("Database query timed out");

    // Exactly one event emitted
    expect(capturedBodies.length).toBe(1);
    expect(capturedBodies[0]).toMatchObject({
      event: "api.request",
      level: "error",
      route: "/api/fail",
      status: 500,
      error_name: "Error",
      error_message: "Database query timed out",
    });
    expect(capturedBodies[0].error_stack).toBeDefined();
  });

  it("schedules async tasks with waitUntil when globalThis.waitUntil exists", () => {
    let scheduled = false;
    (globalThis as any).waitUntil = vi.fn().mockImplementation((promise) => {
      scheduled = true;
      return promise;
    });

    try {
      const dummyPromise = Promise.resolve();
      scheduleTask(dummyPromise);
      expect((globalThis as any).waitUntil).toHaveBeenCalledWith(dummyPromise);
      expect(scheduled).toBe(true);
    } finally {
      delete (globalThis as any).waitUntil;
    }
  });

  it("logs external service calls with axiomLogger.external / logExternalRequest", async () => {
    let capturedBody = "";
    vi.spyOn(globalThis, "fetch").mockImplementation((_url, options) => {
      capturedBody = options?.body as string;
      return Promise.resolve(new Response(JSON.stringify({ ingested: 1 })));
    });

    await axiomLogger.external({
      service: "supabase",
      operation: "rpc.get_category_page_data",
      status: 200,
      duration_ms: 45.2,
      table: "categories",
    });

    const body = JSON.parse(capturedBody);
    expect(body[0]).toMatchObject({
      event: "external.request",
      service: "rsp-web",
      message: "supabase rpc.get_category_page_data 200 (45.2ms)",
      operation: "rpc.get_category_page_data",
      status: 200,
      duration_ms: 45.2,
      table: "categories",
    });
  });

  describe("helper utilities", () => {
    it("toSnakeCase converts camelCase and preserves snake_case and _time", () => {
      expect(toSnakeCase("userId")).toBe("user_id");
      expect(toSnakeCase("targetResource")).toBe("target_resource");
      expect(toSnakeCase("already_snake_case")).toBe("already_snake_case");
      expect(toSnakeCase("_time")).toBe("_time");
      expect(toSnakeCase("durationMs")).toBe("duration_ms");
    });

    it("safeDecodeUri decodes encoded strings and handles malformed strings gracefully", () => {
      expect(safeDecodeUri("%D8%A6%D8%A8")).toBe("\u0626\u0628");
      expect(safeDecodeUri("normal-slug")).toBe("normal-slug");
      expect(safeDecodeUri("%E0%A4%97%E0%A5%80%E0%A4%A4%E0%A4%BE")).toBe(
        "गीता",
      );
      expect(safeDecodeUri("%malformed%")).toBe("%malformed%");
      expect(safeDecodeUri(null)).toBeUndefined();
      expect(safeDecodeUri(undefined)).toBeUndefined();
    });

    it("isSensitiveKey identifies secrets and tokens", () => {
      expect(isSensitiveKey("token")).toBe(true);
      expect(isSensitiveKey("jwt_secret")).toBe(true);
      expect(isSensitiveKey("password")).toBe(true);
      expect(isSensitiveKey("apiKey")).toBe(true);
      expect(isSensitiveKey("authorization")).toBe(true);
      expect(isSensitiveKey("user_id")).toBe(false);
      expect(isSensitiveKey("route")).toBe(false);
    });

    it("serializeError handles Error, string, and error-like objects", () => {
      expect(serializeError(new Error("Boom"))).toMatchObject({
        error_message: "Boom",
        error_name: "Error",
      });
      expect(serializeError("Failure string")).toEqual({
        error_message: "Failure string",
      });
      expect(
        serializeError({ message: "Postgres error", code: "PGRST100" }),
      ).toMatchObject({
        error_message: "Postgres error",
      });
      expect(serializeError(404)).toEqual({
        error_raw: "404",
      });
    });
  });
});
