import { after } from "next/server";

export interface LogAttributes {
  event?: string;
  [key: string]: unknown;
}

export interface ApiRequestLogAttributes {
  route: string;
  method: string;
  status: number;
  duration_ms: number;
  slug?: string;
  page?: number;
  query?: string;
  cache_status?: "HIT" | "MISS" | "BYPASS" | "STALE" | string;
  error_name?: string;
  error_message?: string;
  error_stack?: string;
  [key: string]: unknown;
}

export interface ExternalRequestLogAttributes {
  service: string;
  operation: string;
  duration_ms: number;
  status?: number;
  [key: string]: unknown;
}

const AXIOM_INGEST_URL = "https://api.axiom.co/v1/datasets";

const SENSITIVE_KEY_PATTERNS = [
  /token/i,
  /secret/i,
  /password/i,
  /authorization/i,
  /cookie/i,
  /jwt/i,
  /api[_-]?key/i,
];

export const isSensitiveKey = (key: string): boolean =>
  SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));

export const toSnakeCase = (str: string): string => {
  if (str.startsWith("_")) {
    return str;
  }
  return str
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1_$2")
    .replace(/([a-z\d])([A-Z])/g, "$1_$2")
    .replace(/[-\s]+/g, "_")
    .toLowerCase();
};

export const safeDecodeUri = (value?: string | null): string | undefined => {
  if (!value) {
    return undefined;
  }
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const serializeError = (err: unknown): Record<string, unknown> => {
  if (err instanceof Error) {
    return {
      error_message: err.message,
      error_name: err.name,
      error_stack: err.stack,
    };
  }
  if (typeof err === "string") {
    return { error_message: err };
  }
  if (
    typeof err === "object" &&
    err !== null &&
    "message" in err &&
    typeof (err as { message: unknown }).message === "string"
  ) {
    const errorObj = err as {
      message: string;
      name?: unknown;
      stack?: unknown;
    };
    return {
      error_message: errorObj.message,
      error_name: typeof errorObj.name === "string" ? errorObj.name : "Error",
      ...(typeof errorObj.stack === "string" && {
        error_stack: errorObj.stack,
      }),
    };
  }
  return { error_raw: String(err) };
};

const MAX_SANITIZE_DEPTH = 5;

export const sanitizeValue = (val: unknown, depth = 0): unknown => {
  if (val === null || val === undefined) {
    return val;
  }

  if (val instanceof Error) {
    return serializeError(val);
  }

  if (Array.isArray(val)) {
    if (depth >= MAX_SANITIZE_DEPTH) {
      return "[TRUNCATED]";
    }
    return val.map((item) => sanitizeValue(item, depth + 1));
  }

  if (typeof val === "object") {
    if (depth >= MAX_SANITIZE_DEPTH) {
      return "[TRUNCATED]";
    }
    const sanitizedObj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      const snakeK = toSnakeCase(k);
      if (isSensitiveKey(k)) {
        sanitizedObj[snakeK] = "[REDACTED]";
      } else if (k === "error" || v instanceof Error) {
        Object.assign(sanitizedObj, serializeError(v));
      } else {
        sanitizedObj[snakeK] = sanitizeValue(v, depth + 1);
      }
    }
    return sanitizedObj;
  }

  return val;
};

export const sanitizeAttributes = (
  attributes?: LogAttributes,
): Record<string, unknown> => {
  const sanitized: Record<string, unknown> = {};
  if (!attributes) {
    return sanitized;
  }

  for (const [key, value] of Object.entries(attributes)) {
    const snakeKey = toSnakeCase(key);

    if (isSensitiveKey(key)) {
      sanitized[snakeKey] = "[REDACTED]";
      continue;
    }

    if (key === "error" || value instanceof Error) {
      Object.assign(sanitized, serializeError(value));
    } else {
      sanitized[snakeKey] = sanitizeValue(value, 0);
    }
  }

  return sanitized;
};

export const scheduleTask = (
  task: Promise<unknown> | (() => Promise<unknown>),
): void => {
  // 1. Try globalThis.waitUntil (Vercel Edge / Cloudflare Workers)
  const globalWaitUntil = (
    globalThis as unknown as { waitUntil?: (p: Promise<unknown>) => void }
  ).waitUntil;
  if (typeof globalWaitUntil === "function") {
    try {
      globalWaitUntil(typeof task === "function" ? task() : task);
      return;
    } catch {
      // Fall through if waitUntil fails
    }
  }

  // 2. Try Next.js after() (Next.js 15+ Node.js and Edge serverless lifecycle)
  try {
    after(typeof task === "function" ? task : () => task);
    return;
  } catch {
    // Expected when called outside of request context (e.g. tests or client)
  }

  // 3. Fallback: catch any unhandled background rejections
  const promise = typeof task === "function" ? task() : task;
  promise.catch((err) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[Axiom Logger] Background task failed:", err);
    }
  });
};

export const sendAxiomLog = (
  level: "info" | "warn" | "error",
  message: string,
  attributes?: LogAttributes,
): Promise<void> => {
  // Strictly server-side only: ignore if running in client browser
  if (typeof window !== "undefined" && process.env["VITEST"] === undefined) {
    return Promise.resolve();
  }

  // Skip during build phase to avoid sending build telemetry and accessing time during static prerender
  if (process.env["NEXT_PHASE"] === "phase-production-build") {
    return Promise.resolve();
  }

  const token = process.env["AXIOM_TOKEN"];
  if (!token) {
    return Promise.resolve();
  }

  const dataset = process.env["AXIOM_DATASET"] || "rsp";
  const url = `${AXIOM_INGEST_URL}/${dataset}/ingest`;

  const sanitizedAttributes = sanitizeAttributes(attributes);

  const eventName =
    typeof sanitizedAttributes["event"] === "string"
      ? (sanitizedAttributes["event"] as string)
      : `app.${level}`;

  const send = async (): Promise<void> => {
    const eventPayload = {
      _time: new Date().toISOString(),
      level,
      event: eventName,
      message,
      environment: process.env.NODE_ENV || "production",
      ...sanitizedAttributes,
      service: "rsp-web",
    };

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([eventPayload]),
        cache: "no-store",
      });

      if (!res.ok && process.env.NODE_ENV === "development") {
        console.error(`[Axiom Logger] Ingest response status: ${res.status}`);
      }
    } catch (err) {
      if (process.env.NODE_ENV === "development") {
        console.error("[Axiom Logger] Ingest failed:", err);
      }
    }
  };

  // In test environment, execute directly so callers can await the promise
  if (process.env["VITEST"] !== undefined) {
    return send();
  }

  scheduleTask(send);
  return Promise.resolve();
};

export const logApiRequest = (
  attributes: ApiRequestLogAttributes,
): Promise<void> => {
  const { route, method, status, duration_ms } = attributes;
  const level: "info" | "warn" | "error" =
    status >= 500 ? "error" : status >= 400 ? "warn" : "info";
  const message = `${method.toUpperCase()} ${route} ${status} (${duration_ms}ms)`;

  const decodedSlug = attributes.slug
    ? safeDecodeUri(attributes.slug)
    : undefined;

  return sendAxiomLog(level, message, {
    event: "api.request",
    ...attributes,
    ...(decodedSlug !== undefined && { slug: decodedSlug }),
    ...(attributes.query !== undefined && { query: attributes.query }),
  });
};

export const logExternalRequest = (
  attributes: ExternalRequestLogAttributes,
): Promise<void> => {
  const { service, operation, duration_ms, status } = attributes;
  const level: "info" | "warn" | "error" =
    status !== undefined && status >= 500
      ? "error"
      : status !== undefined && status >= 400
        ? "warn"
        : "info";
  const message = `${service} ${operation} ${status ? `${status} ` : ""}(${duration_ms}ms)`;

  return sendAxiomLog(level, message, {
    event: "external.request",
    ...attributes,
  });
};

export const axiomLogger = {
  info: (message: string, attributes?: LogAttributes) =>
    sendAxiomLog("info", message, attributes),
  warn: (message: string, attributes?: LogAttributes) =>
    sendAxiomLog("warn", message, attributes),
  error: (message: string, attributes?: LogAttributes) =>
    sendAxiomLog("error", message, attributes),
  request: (attributes: ApiRequestLogAttributes) => logApiRequest(attributes),
  external: (attributes: ExternalRequestLogAttributes) =>
    logExternalRequest(attributes),
};

export const withApiLogging = <
  TArgs extends unknown[],
  TReturn extends Response,
>(
  route: string,
  handler: (...args: TArgs) => Promise<TReturn> | TReturn,
) => {
  return async (...args: TArgs): Promise<TReturn> => {
    const start = performance.now();
    const req = args[0] as (Request & { nextUrl?: URL }) | undefined;
    const method = req?.method?.toUpperCase() || "GET";

    let slug: string | undefined;
    let query: string | undefined;
    let page: number | undefined;

    if (req?.url) {
      try {
        const url = req.nextUrl ?? new URL(req.url, "https://localhost");
        query = url.search
          ? url.search.startsWith("?")
            ? url.search.slice(1)
            : url.search
          : undefined;
        const pageParam =
          url.searchParams.get("page") || url.searchParams.get("p");
        if (pageParam && !Number.isNaN(Number(pageParam))) {
          page = Number(pageParam);
        }
        slug = safeDecodeUri(url.searchParams.get("slug"));
      } catch {
        // Ignore URL parsing errors
      }
    }

    const context = args[1] as
      | {
          params?:
            | Promise<{ id?: string; slug?: string | string[] }>
            | { id?: string; slug?: string | string[] };
        }
      | undefined;
    if (context?.params) {
      try {
        const resolved =
          context.params instanceof Promise
            ? await context.params
            : context.params;
        if (resolved?.slug) {
          const rawSlug = Array.isArray(resolved.slug)
            ? resolved.slug.join("/")
            : resolved.slug;
          slug = safeDecodeUri(rawSlug);
        } else if (resolved?.id) {
          slug = safeDecodeUri(resolved.id);
        }
      } catch {
        // Ignore param resolution errors
      }
    }

    if (!slug && req?.url && route.includes("[")) {
      try {
        const url = req.nextUrl ?? new URL(req.url, "https://localhost");
        const routeSegments = route.split("/").filter(Boolean);
        const pathSegments = url.pathname.split("/").filter(Boolean);
        for (let i = 0; i < routeSegments.length; i++) {
          if (routeSegments[i]?.startsWith("[") && pathSegments[i]) {
            slug = safeDecodeUri(pathSegments[i]);
            break;
          }
        }
      } catch {
        // Ignore
      }
    }

    let status = 500;
    let cacheStatus: string | undefined;
    let caughtError: unknown;

    try {
      const res = await handler(...args);
      if (res && typeof res.status === "number") {
        status = res.status;
        if (res.headers && typeof res.headers.get === "function") {
          const headerCache =
            res.headers.get("x-cache") ||
            res.headers.get("cf-cache-status") ||
            res.headers.get("x-nextjs-cache");
          if (headerCache) {
            cacheStatus = headerCache.toUpperCase();
          }
        }
      }
      return res;
    } catch (err) {
      status = 500;
      caughtError = err;
      throw err;
    } finally {
      const durationMs = Math.round((performance.now() - start) * 100) / 100;
      const errorAttrs = caughtError ? serializeError(caughtError) : undefined;
      const logPromise = logApiRequest({
        route,
        method,
        status,
        duration_ms: durationMs,
        ...(slug !== undefined && { slug }),
        ...(page !== undefined && { page }),
        ...(query !== undefined && { query }),
        ...(cacheStatus !== undefined && { cache_status: cacheStatus }),
        ...errorAttrs,
      });
      scheduleTask(logPromise);
    }
  };
};
