// Supabase
export const SUPABASE_URL = process.env["NEXT_PUBLIC_SUPABASE_URL"] as string;
export const SUPABASE_PUBLISHABLE_KEY = process.env[
  "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"
] as string;
export const SYNC_INTERVAL = Number.parseInt(
  process.env["NEXT_PUBLIC_SYNC_INTERVAL"] || "900000", // 15 min
  10,
); // 5 min default
export const SYNC_PAGE_SIZE = 1000;
export const SYNC_CONCURRENCY = 4;
export const MAX_SYNC_STALE_DAYS = 30;
export const ONE_DAY_MS = 24 * 3600_000;

export const ASSET_BASE_URL = process.env[
  "NEXT_PUBLIC_ASSET_BASE_URL"
] as string;
export const AUDIO_BASE_URL = process.env["NEXT_PUBLIC_AUDIO_BASE_URL"];
export const STREAM_LIMIT_BYTES = 100 * 1024 * 1024; // 100MB

// IndexedDB
export const DB_NAME = "k";
export const DB_VERSION = 1;

export const STORE = {
  ANNOUNCEMENTS: "announcements",
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
  ROLE_SYNC_META: "role_sync_meta",
  ROLE_META: "role_meta",
  CACHE_LEDGER: "cache_ledger",
  USERS: "users",
  USER_EDIT_REQUESTS: "user_edit_requests",
  USER_SERVICE_INTERESTS: "user_service_interests",
  USER_QUERIES: "user_queries",
  QUERY_REPLIES: "query_replies",
  DELETED_RECORDS: "deleted_records",
  RESTRICTED_RECORDS: "restricted_records",
} as const;

export const STRING_KEY_TABLES = new Set<string>([
  STORE.REDIRECTS,
  STORE.USERS,
  STORE.USER_EDIT_REQUESTS,
  STORE.USER_SERVICE_INTERESTS,
  STORE.USER_QUERIES,
  STORE.QUERY_REPLIES,
]);

export const ROLE_SYNCED_TABLES = [
  STORE.CATEGORIES,
  STORE.RECORDINGS,
  STORE.MATERIALS,
  STORE.ANNOUNCEMENTS,
  STORE.FEATURED_SECTIONS,
  STORE.FEATURED_ITEMS,
] as const;

export const SEARCH_LOOKUP_TABLES = [
  STORE.SPEAKERS,
  STORE.VENUES,
  STORE.LANGUAGES,
  STORE.EVENTS,
] as const;

export const GENERIC_TABLES = [
  STORE.ANNOUNCEMENTS,
  STORE.CATEGORIES,
  STORE.RECORDINGS,
  STORE.MATERIALS,
  STORE.SPEAKERS,
  STORE.LANGUAGES,
  STORE.CONTENT_TYPES,
  STORE.VENUES,
  STORE.SERVICES,
  STORE.REDIRECTS,
  STORE.EVENTS,
  STORE.FAQ_CATEGORIES,
  STORE.FAQS,
  STORE.FEATURED_SECTIONS,
  STORE.FEATURED_ITEMS,
  STORE.DELETED_RECORDS,
  STORE.RESTRICTED_RECORDS,
] as const;

export const USER_SPECIFIC_TABLES = [
  STORE.USERS,
  STORE.USER_EDIT_REQUESTS,
  STORE.USER_SERVICE_INTERESTS,
  STORE.USER_QUERIES,
  STORE.QUERY_REPLIES,
] as const;

export const FEATURE_FLAGS_TABLE = "feature_flags";

export const SYNC_COLUMNS = {
  [STORE.CATEGORIES]: `
    id,
    allowed_roles,
    img_id,
    name,
    order_ind,
    path,
    url_path
  `,

  [STORE.RECORDINGS]: `
    id,
    allowed_roles,
    audio_id,
    category_id,
    event_id,
    lang_ids,
    name,
    order_ind,
    recorded_at,
    size,
    speaker_ids,
    type_id,
    venues_id,
    yt_id
  `,

  [STORE.MATERIALS]: `
    id,
    allowed_roles,
    name,
    recording_id,
    size,
    uri,
    type
  `,

  [STORE.SPEAKERS]: `
    id,
    name
  `,

  [STORE.LANGUAGES]: `
    id,
    name,
    native_name
  `,

  [STORE.CONTENT_TYPES]: `
    id,
    name
  `,

  [STORE.VENUES]: `
    id,
    name
  `,

  [STORE.EVENTS]: `
    id,
    name,
    short_name
  `,

  [STORE.REDIRECTS]: `
    id,
    to_path
  `,

  [STORE.SERVICES]: `
    id,
    description,
    is_public,
    name,
    order_ind,
    type
  `,

  [STORE.FAQ_CATEGORIES]: `
    id,
    name,
    order_ind,
    slug
  `,

  [STORE.FAQS]: `
    id,
    category_id,
    answer,
    question,
    is_published,
    order_ind
  `,

  [STORE.ANNOUNCEMENTS]: `
    id,
    allowed_roles,
    title,
    subtitle,
    badge_text,
    category,
    cta_label,
    cta_url,
    media_path,
    media_type,
    bg_gradient,
    start_date,
    end_date,
    is_annual_recurring,
    ui_props,
    is_active,
    order_ind
  `,

  [STORE.FEATURED_SECTIONS]: `
    id,
    allowed_roles,
    title,
    layout,
    is_active,
    order_ind
  `,

  [STORE.FEATURED_ITEMS]: `
    id,
    allowed_roles,
    entity_id,
    entity_type,
    order_ind,
    section_id
  `,

  [STORE.USERS]: `
    id,
    email,
    name,
    avatar_url,
    ashram,
    temple,
    purpose,
    authority_name,
    authority_relationship,
    authority_email,
    status,
    role_id,
    phone,
    updated_at
  `,

  [STORE.USER_EDIT_REQUESTS]: `
    id,
    user_id,
    requested_role_id,
    name,
    ashram,
    temple,
    purpose,
    authority_name,
    authority_relationship,
    authority_email,
    phone,
    status,
    reason,
    review_comment,
    requested_at,
    reviewed_at,
    reviewed_by,
    actor_type,
    actor_id,
    updated_at
  `,

  [STORE.USER_SERVICE_INTERESTS]: `
    id,
    user_id,
    service_id,
    level,
    notes,
    updated_at
  `,

  [STORE.USER_QUERIES]: `
    id,
    user_id,
    guest_email,
    guest_name,
    subject,
    message,
    category,
    status,
    attachments,
    created_at,
    updated_at
  `,

  [STORE.QUERY_REPLIES]: `
    id,
    query_id,
    user_id,
    message,
    attachments,
    updated_at
  `,

  [STORE.DELETED_RECORDS]: `
    id,
    table_name,
    record_id
  `,

  [STORE.RESTRICTED_RECORDS]: `
    id,
    table_name,
    record_id
  `,
} as const;

// Index names
export const INDEX = {
  BY_URL: "by-url",
  BY_PATH: "by-path",
  BY_CATEGORY_ID: "by-category_id",
  BY_RECORDING_ID: "by-recording_id",
  BY_SECTION_ID: "by-section_id",
  BY_QUERY_ID: "by-query_id",
} as const;

// Metadata keys
export const META_KEY = {
  CLEANUP_ROLE: "cleanup_role",
  SYNC_ROLE: "sync_role",
  CLEANUP_USER_ID: "cleanup_user_id",
  PUBLIC_FEATURES: "public_features",
  USER_FEATURES: "user_features",
} as const;

export const LOCAL_STORAGE = {
  READ_NOTIFICATIONS: "read-notif-ids",
  NOTIFICATION_GROUPS: "rsp_notification_groups",
  CLEANUP_USER_ID: "cleanup_user_id",
} as const;

// Worker message types
export const WORKER_MSG = {
  // Sync
  START_PUBLIC_SYNC: "START_PUBLIC_SYNC",
  START_ROLE_SYNC: "START_ROLE_SYNC",
  START_USER_SYNC: "START_USER_SYNC",
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
  HOMEPAGE: "homepage",
  CATEGORY_PAGE: "category-page",
  ALL_CATEGORIES: "categories",
  SYNC_PUBLIC: "sync-public",
  SYNC_ROLE: "sync-role",
  SYNC_USER: "sync-user",
  SPEAKERS: "speakers",
  LANGUAGES: "languages",
  VENUES: "venues",
  EVENTS: "events",
  AUDIO_CACHE_LIST: "audio-cache-list",
  MATERIALS_CACHE_LIST: "materials-cache-list",
  FEATURE_CONFIG: "feature-config",
} as const;

// Search
export const SEARCH_LIMIT = 15;
export const SEARCH_TOLERANCE = 1;
export const SEARCH_BOOST_NAME = 2.0;
export const SEARCH_BOOST_SPEAKER = 1.5;
export const SEARCH_BOOST_EVENT = 1.2;
export const INVALIDATE_ALL_THRESHOLD = 10;

export const QUERY_CATEGORIES = [
  { value: "consultation", label: "Consultation / Speaker Invitation" },
  { value: "technical", label: "Technical Support / Feedback" },
  { value: "spiritual", label: "Spiritual Guidance / Inquiry" },
  { value: "feedback", label: "Feedback" },
  { value: "volunteering_inquiry", label: "Volunteering Inquiry" },
  { value: "general", label: "General Inquiry" },
  { value: "books", label: "Books & Publications" },
  { value: "courses", label: "Online Certified Courses" },
  { value: "services", label: "Service Related Queries" },
];

export const ENGAGEMENT_TYPES = [
  "Corporate Workshop / Seminar",
  "Academic Lecture / Keynote",
  "Leadership Retreat / Executive Advisory",
  "Youth / Community Festival",
  "General Advisory / Consultation",
] as const;

export type EngagementType = (typeof ENGAGEMENT_TYPES)[number];

export const AUDIO_CACHE_NAME = "rsp-audio-cache";
export const MATERIALS_CACHE_NAME = "rsp-materials-cache";

export const PHILOSOPHICAL_CONCEPTS = [
  "Bhakti — Path of Devotion",
  "Atma — Immutable Spirit",
  "Śravanam — Hearing Sacred Sound",
  "Jnana — Transcendent Knowledge",
  "Sadhana — Daily Spiritual Practice",
  "Chant & Be Happy",
  "Seva — Unconditional Service",
  "Ahimsa — Universal Compassion",
  "Yoga — Union with Supreme",
  "Dharma — Eternal Duty",
] as const;

export const FEATURE_FLAGS = {};
