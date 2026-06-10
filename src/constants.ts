// Supabase
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
export const SUPABASE_PUBLISHABLE_KEY = process.env
  .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY as string;
export const SYNC_INTERVAL = Number.parseInt(
  process.env.NEXT_PUBLIC_SYNC_INTERVAL || "300000",
  10,
); // 5 min default
export const SUPABASE_SCHEMA = "prod";
export const SYNC_PAGE_SIZE = 1000;
export const SYNC_CONCURRENCY = 4;

// IndexedDB
export const DB_NAME = "rsp.com";
export const DB_VERSION = 2;

// Store names
export const STORE = {
  CATEGORIES: "categories",
  RECORDINGS: "recordings",
  MATERIALS: "materials",
  SPEAKERS: "speakers",
  LANGUAGES: "languages",
  CONTENT_TYPES: "content_types",
  VENUES: "venues",
  SERVICES: "services",
  REDIRECTS: "redirects",
  EVENTS: "events",
  FAQ_CATEGORIES: "faq_categories",
  FAQS: "faqs",
  FEATURED_SECTIONS: "featured_sections",
  FEATURED_ITEMS: "featured_items",
  METADATA: "metadata",
} as const;

// Index names
export const INDEX = {
  BY_URL: "by-url",
  BY_PATH: "by-path",
  BY_CATEGORY_ID: "by-category_id",
  BY_RECORDING_ID: "by-recording_id",
  BY_SECTION_ID: "by-section_id",
} as const;

// Metadata keys
export const META_KEY = {
  LAST_SYNC_PREFIX: "last_sync_",
  CATEGORIES_LAST_UPDATED: "categories_last_updated",
  CLEANUP_ROLE: "cleanup_role",
} as const;

// Worker message types
export const WORKER_MSG = {
  // Sync
  START_SYNC: "START_SYNC",
  // Cleanup
  START_CLEANUP: "START_CLEANUP",
  // Search
  BUILD_INDEX: "BUILD_INDEX",
  UPDATE_DOCS: "UPDATE_DOCS",
  SEARCH_ALL: "SEARCH_ALL",
  // Outbound
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
  PROGRESS: "PROGRESS",
  SKIPPED: "SKIPPED",
  INDEX_READY: "INDEX_READY",
  INDEX_ERROR: "INDEX_ERROR",
  SEARCH_RESULT: "SEARCH_RESULT",
} as const;

// Query keys
export const QUERY_KEY = {
  CATEGORY_PAGE: "category-page",
  SYNC: "sync",
} as const;

// Search
export const SEARCH_LIMIT = 15;
export const SEARCH_TOLERANCE = 1;
export const SEARCH_BOOST_NAME = 2.0;
export const SEARCH_BOOST_SPEAKER = 1.5;
export const INVALIDATE_ALL_THRESHOLD = 100;
