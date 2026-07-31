// Supabase
export const SUPABASE_URL = process.env["NEXT_PUBLIC_SUPABASE_URL"] as string;
export const SUPABASE_PUBLISHABLE_KEY = process.env[
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
] as string;
export const SYNC_INTERVAL = Number.parseInt(
  process.env["NEXT_PUBLIC_SYNC_INTERVAL"] || "3600000", // 1 hour
  10,
); // 5 min default
export const SYNC_PAGE_SIZE = 1000;
export const SYNC_CONCURRENCY = 4;

export const ASSET_BASE_URL = process.env[
  "NEXT_PUBLIC_ASSET_BASE_URL"
] as string;
export const AUDIO_BASE_URL = process.env["NEXT_PUBLIC_AUDIO_BASE_URL"];

// IndexedDB
export const DB_NAME = "rsp";
export const DB_VERSION = 1;

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
  SYNC_META: "sync_meta",
  ROLE_META: "role_meta",
  CACHE_LEDGER: "cache_ledger",
} as const;

export const ROLE_SYNCED_TABLES = [
  STORE.CATEGORIES,
  STORE.RECORDINGS,
  STORE.MATERIALS,
] as const;

export const SEARCH_LOOKUP_TABLES = [
  STORE.SPEAKERS,
  STORE.VENUES,
  STORE.LANGUAGES,
  STORE.EVENTS,
] as const;

export const SYNC_COLUMNS = {
  categories: `
    id,
    allowed_roles,
    img_id,
    name,
    order_ind,
    path,
    url_path
  `,

  recordings: `
    id,
    allowed_roles,
    audio_id,
    category_id,
    event_id,
    lang_ids,
    name,
    order_ind,
    recorded_at,
    speaker_ids,
    type_id,
    venues_id,
    yt_id
  `,

  materials: `
    id,
    allowed_roles,
    name,
    recording_id,
    uri,
    type
  `,

  speakers: `
    id,
    name
  `,

  languages: `
    id,
    name,
    native_name
  `,

  content_types: `
    id,
    name
  `,

  venues: `
    id,
    name
  `,

  events: `
    id,
    name,
    short_name
  `,

  redirects: `
    id,
    to_path
  `,

  services: `
    id,
    created_at,
    description,
    is_public,
    name,
    order_ind,
    type
  `,

  faq_categories: `
    id,
    name,
    order_ind,
    slug
  `,

  faqs: `
    id,
    category_id,
    answer,
    question,
    is_published,
    order_ind
  `,

  featured_sections: `
    id,
    title,
    layout,
    is_active,
    order_ind
  `,

  featured_items: `
    id,
    entity_id,
    entity_type,
    order_ind,
    section_id
  `,
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
  CLEANUP_ROLE: "cleanup_role",
  SYNC_ROLE: "sync_role",
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
  ALL_CATEGORIES: "categories",
  NOTIFICATIONS: "notifications",
  SYNC: "sync",
  SPEAKERS: "speakers",
  LANGUAGES: "languages",
  VENUES: "venues",
  USER_PROFILE: "user-profile",
  USER_PENDING_REQUEST: "user-pending-request",
  AUDIO_CACHE_LIST: "audio-cache-list",
} as const;

// Search
export const SEARCH_LIMIT = 15;
export const SEARCH_TOLERANCE = 1;
export const SEARCH_BOOST_NAME = 2.0;
export const SEARCH_BOOST_SPEAKER = 1.5;
export const INVALIDATE_ALL_THRESHOLD = 10;

export const QUERY_CATEGORIES = [
  { value: "technical", label: "Technical Support / Feedback" },
  { value: "spiritual", label: "Spiritual Guidance / Inquiry" },
  { value: "feedback", label: "Feedback" },
  { value: "volunteering_inquiry", label: "Volunteering Inquiry" },
  { value: "general", label: "General Inquiry" },
  { value: "books", label: "Books & Publications" },
  { value: "courses", label: "Online Certified Courses" },
  { value: "services", label: "Service Related Queries" },
];

export const AUDIO_CACHE_NAME = "rsp-audio-cache";

export const PHILOSOPHICAL_CONCEPTS = [
  "Bhakti — Path of Devotion",
  "Atma — Immutable Spirit",
  "Sravanam — Hearing Sacred Sound",
  "Jnana — Transcendent Knowledge",
  "Sadhana — Daily Spiritual Practice",
  "Chant & Be Happy",
  "Seva — Unconditional Service",
  "Ahimsa — Universal Compassion",
  "Yoga — Union with Supreme",
  "Dharma — Eternal Duty",
] as const;
