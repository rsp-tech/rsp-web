import type { User } from "@supabase/supabase-js";
import { type ClassValue, clsx } from "clsx";
import type { MouseEvent as ReactMouseEvent } from "react";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const categoryPath = (urlPath?: string | null) =>
  urlPath ? `/library/${urlPath.replaceAll(".", "/")}` : "/library";

export const slugToLabel = (slug: string) =>
  safeDecodeUri(slug)
    .split(/[_-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
export const errorMessage = (err: unknown) =>
  err instanceof Error ? err.message : String(err);

export const getUserDisplayName = (user?: User, fallback = "User") =>
  (user?.user_metadata["full_name"] as string | undefined) ??
  user?.email?.split("@")[0] ??
  fallback;

export const createLimiter = (concurrency: number) => {
  let active = 0;
  const queue: (() => void)[] = [];
  return function limit<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      const run = () => {
        active++;
        fn()
          .then(resolve, reject)
          .finally(() => {
            active--;
            queue.shift()?.();
          });
      };
      active < concurrency ? run() : queue.push(run);
    });
  };
};

export const sortByOrderInd =
  (direction: 1 | -1 = 1) =>
  (a: { order_ind?: number | null }, b: { order_ind?: number | null }) =>
    direction * ((a.order_ind ?? 0) - (b.order_ind ?? 0));

export const sortByDate =
  <T extends {}, K extends keyof T>(
    order: 1 | -1 = 1,
    fieldName: K = "updated_at" as K,
  ): ((a: T, b: T) => number) =>
  (a, b) => {
    const timeA = a[fieldName] ? new Date(a[fieldName] as string).getTime() : 0;
    const timeB = b[fieldName] ? new Date(b[fieldName] as string).getTime() : 0;
    return order * (timeA - timeB);
  };

const STATIC_FILE_EXTENSIONS =
  /\.(png|jpg|jpeg|webp|avif|gif|svg|ico|txt|xml|json|map|css|js|webmanifest|woff|woff2|ttf|eot)$/i;

export const isValidCategoryPath = (value: string) =>
  /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)*$/.test(value) &&
  !value.startsWith("_next") &&
  !STATIC_FILE_EXTENSIONS.test(value);

const safeDecodeUri = (str: string): string => {
  try {
    return decodeURIComponent(str);
  } catch {
    return str;
  }
};

export const toLtreeSlug = (name: string): string =>
  safeDecodeUri(name)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-");

/**
 * Converts a pathname (string or array of slug segments) to a DB urlPath (dot-separated, ltree format).
 * Automatically strips the leading "library" segment if present.
 * E.g., "/library/spiritual-discourses/bg" -> "spiritual-discourses.bg"
 * E.g., ["library", "spiritual-discourses", "bg"] -> "spiritual-discourses.bg"
 */
export const pathToUrlPath = (path: string | string[]): string => {
  let segments = Array.isArray(path)
    ? [...path]
    : path.split("/").filter(Boolean);

  if (segments[0] === "library" || segments[0] === "content") {
    segments = segments.slice(1);
  }

  return segments.map(toLtreeSlug).filter(Boolean).join(".");
};

export const toRoleId = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isInteger(value) ? value : undefined;

export interface ConsultationDetails {
  organization: string;
  engagementType: string;
  name: string;
  email: string;
  phone: string;
  audienceSize?: string;
  preferredDates?: string;
  message: string;
}

export const formatConsultationMessage = (
  details: ConsultationDetails,
): string =>
  [
    "--- Consultation / Speaker Invitation Details ---",
    `Organization / Institution: ${details.organization.trim()}`,
    `Engagement Type: ${details.engagementType}`,
    `Contact Person: ${details.name.trim()}`,
    `Official Email: ${details.email.trim()}`,
    `Phone / WhatsApp: ${details.phone.trim()}`,
    details.audienceSize?.trim()
      ? `Estimated Audience Size: ${details.audienceSize.trim()}`
      : null,
    details.preferredDates?.trim()
      ? `Preferred Dates / Timeframe: ${details.preferredDates.trim()}`
      : null,
    "",
    "--- Proposed Theme / Message Details ---",
    details.message.trim(),
  ]
    .filter(Boolean)
    .join("\n");

export const parseSize = (size?: unknown): number => {
  if (size == null) return 0;
  if (typeof size === "number") {
    return Number.isFinite(size) ? Math.max(0, size) : 0;
  }
  if (typeof size === "string") {
    const trimmed = size.trim();
    if (!trimmed) return 0;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
  }
  return 0;
};

export const formatSize = (bytes?: unknown): string => {
  const num = parseSize(bytes);
  if (num <= 0) return "";
  const k = 1024;
  if (num < k) return `${num}B`;
  if (num < k * k) {
    const kb = num / k;
    return `${Math.round(kb)}kB`;
  }
  if (num < k * k * k) {
    const mb = num / (k * k);
    return `${mb >= 10 ? Math.round(mb) : mb.toFixed(1).replace(/\.0$/, "")}MB`;
  }
  const gb = num / (k * k * k);
  return `${gb.toFixed(1).replace(/\.0$/, "")}GB`;
};

export const navigateClientSide = (href: string, e?: ReactMouseEvent) => {
  e?.preventDefault();
  window.history.pushState(null, "", href);
  window.scrollTo({ top: 0, behavior: "instant" });
};

export const parseDate = (dateStr?: string | null): Date | null => {
  if (!dateStr) return null;
  const date = new Date(dateStr);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const isSameDay = (d1: Date, d2: Date = new Date()): boolean =>
  d1.getDate() === d2.getDate() &&
  d1.getMonth() === d2.getMonth() &&
  d1.getFullYear() === d2.getFullYear();

export const formatQueryDate = (dateStr?: string | null): string => {
  const date = parseDate(dateStr);
  if (!date) return "";

  const now = new Date();
  const timeStr = date.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  if (isSameDay(date, now)) {
    return `Today, ${timeStr}`;
  }

  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (isSameDay(date, yesterday)) {
    return `Yesterday, ${timeStr}`;
  }

  return `${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })}, ${timeStr}`;
};

export const formatCompactDate = (dateStr?: string | null): string => {
  const date = parseDate(dateStr);
  if (!date) return "";

  const now = new Date();
  if (isSameDay(date, now)) {
    return date.toLocaleTimeString(undefined, {
      hour: "numeric",
      minute: "2-digit",
    });
  }

  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
};
