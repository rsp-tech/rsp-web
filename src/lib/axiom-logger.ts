interface LogAttributes {
  [key: string]: unknown;
}

const AXIOM_INGEST_URL = "https://api.axiom.co/v1/datasets";

const serializeError = (err: unknown): Record<string, unknown> => {
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
  return { error_raw: String(err) };
};

export const sendAxiomLog = (
  level: "info" | "warn" | "error",
  message: string,
  attributes?: LogAttributes,
): void => {
  // Strictly server-side only: ignore if running in client browser
  if (typeof window !== "undefined" && process.env["VITEST"] === undefined) {
    return;
  }

  const token = process.env["AXIOM_TOKEN"];
  if (!token) {
    return;
  }

  const dataset = process.env["AXIOM_DATASET"] || "rsp";
  const url = `${AXIOM_INGEST_URL}/${dataset}/ingest`;

  const sanitizedAttributes: Record<string, unknown> = {};
  if (attributes) {
    for (const [key, value] of Object.entries(attributes)) {
      if (value instanceof Error) {
        Object.assign(sanitizedAttributes, serializeError(value));
      } else {
        sanitizedAttributes[key] = value;
      }
    }
  }

  const event = {
    _time: new Date().toISOString(),
    service: "rsp-web",
    level,
    message,
    environment: process.env.NODE_ENV || "production",
    ...sanitizedAttributes,
  };

  fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify([event]),
    cache: "no-store",
  }).catch((err) => {
    if (process.env.NODE_ENV === "development") {
      console.error("[Axiom Logger] Ingest failed:", err);
    }
  });
};

export const axiomLogger = {
  info: (message: string, attributes?: LogAttributes) =>
    sendAxiomLog("info", message, attributes),
  warn: (message: string, attributes?: LogAttributes) =>
    sendAxiomLog("warn", message, attributes),
  error: (message: string, attributes?: LogAttributes) =>
    sendAxiomLog("error", message, attributes),
};
