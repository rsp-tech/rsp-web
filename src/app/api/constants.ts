// Revalidation intervals (in seconds)
export const REVALIDATE_4_HOURS = 14400;
export const REVALIDATE_8_HOURS = 28800;

// Cache tags and keys (guarantees zero typo mismatch between endpoints and revalidation)
export const CACHE_TAG = {
  SYNC_META: "sync-meta",
  CSV_BACKUP: "csv-backup",
} as const;

export const CACHE_KEY = {
  SYNC_META: "sync-meta-cache",
  CSV_BACKUP: "csv-backup",
} as const;

// Internal API Paths
export const API_PATH = {
  SYNC_META: "/api/sync/meta",
} as const;

// External Backup Source
export const CSV_ENDPOINT = process.env["CSV_ENDPOINT"]