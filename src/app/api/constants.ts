// Revalidation intervals (in seconds)
export const REVALIDATE_24_HOURS = 86400; // 24 hours
export const REVALIDATE_30_DAYS = 2592000; // 30 days

// Cache tags & keys (unified for cache storage slots and on-demand revalidation)
export const CACHE_TAG = {
  SYNC_META: "sync-meta",
  BACKUP_RESOURCES: "backup-resources",
  FEATURE_FLAGS: "feature-flags",
  LIVE_DIFF: "sync-live-diff",
} as const;

// Internal API Paths
export const API_PATH = {
  SYNC_META: "/api/sync/meta",
  SYNC: "/api/sync",
  REVALIDATE: "/api/revalidate",
  REVALIDATE_BACKUP: "/api/revalidate/backup",
} as const;

// External Backup Source
export const CSV_ENDPOINT = process.env["CSV_ENDPOINT"];
