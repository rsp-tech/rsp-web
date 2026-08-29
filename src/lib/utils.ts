import type { User } from "@supabase/supabase-js";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export const cn = (...inputs: ClassValue[]) => twMerge(clsx(inputs));

export const categoryPath = (urlPath: string) =>
  urlPath.replaceAll(".", "/").replaceAll("_", "-");

export const slugToLabel = (slug: string) =>
  slug
    .split("_")
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

/**
 * Converts a pathname (string or array of slug segments) to a DB urlPath (dot-separated, ltree format).
 * E.g., "/spiritual-discourses/bg" -> "spiritual_discourses.bg"
 * E.g., ["spiritual-discourses", "bg"] -> "spiritual_discourses.bg"
 */
export const pathToUrlPath = (path: string | string[]): string => {
  const segments = Array.isArray(path) ? path : path.split("/").filter(Boolean);
  return segments.join(".").replace(/-/g, "_");
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
