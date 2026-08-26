import type { WORKER_MSG } from "@/constants";
import type { Database } from "@/database.types";

type LocalTable<T> = Omit<T, "created_at" | "metadata" | "updated_at">;

export type DB_TABLE<
  T extends keyof Database["prod"]["Tables"],
  U extends keyof Database["prod"]["Tables"][T] = "Row",
> = Database["prod"]["Tables"][T][U];

export type Tables<
  T extends keyof Database["prod"]["Tables"],
  U extends keyof Database["prod"]["Tables"][T] = "Row",
> = LocalTable<DB_TABLE<T, U>>;

export type Enums<T extends keyof Database["prod"]["Enums"]> =
  Database["prod"]["Enums"][T];

type DatabaseCategory = Tables<"categories">;

export type Category = Omit<DatabaseCategory, "path" | "url_path"> & {
  path: string;
  url_path: string;
};
export type Recording = Tables<"recordings">;
export type Speaker = Tables<"speakers">;
export type Language = Tables<"languages">;
export type ContentType = Tables<"content_types">;
export type Venue = Tables<"venues">;
export type Material = Tables<"materials">;
export type Event = Tables<"events">;
export type Redirect = Tables<"redirects">;
export type Service = Tables<"services">;
export type UserServiceInterest = Tables<"user_service_interests", "Insert">;

export interface RecordingMaterialMetadata {
  id: string;
  fileName: string;
  mimeType: string;
  deleted?: boolean;
}

export type FaqCategory = Tables<"faq_categories">;
export type Faq = Tables<"faqs">;
export type FeaturedSection = Tables<"featured_sections">;
export type FeaturedItem = Tables<"featured_items">;
export type UserQuery = DB_TABLE<"user_queries">;
export type QueryReply = DB_TABLE<"query_replies">;
export type DeletedRecord = DB_TABLE<"deleted_records">;
export type RestrictedRecord = DB_TABLE<"restricted_records">;

export type UserQueryWithUser = UserQuery & {
  users: { name: string | null; email: string } | null;
};

export type QueryReplyWithUser = QueryReply & {
  users: { name: string | null; email: string } | null;
};

export interface EnrichedRecording extends Recording {
  materials?: Material[];
  category?: Category | null;
}

export type SearchableTable = "recordings" | "categories" | "materials";
export type SearchTarget = SearchableTable;

export interface RecordingSearchDocument {
  id: string;
  name: string;
  speaker_names: string;
  languages: string;
  venue_name: string;
  event_name: string;
  date: number;
  speaker_ids: number[];
  category_id: number;
  lang_ids: number[];
  venues_id: number;
  event_id: number;
}

export interface CategorySearchDocument {
  id: string;
  name: string;
  url_path: string;
  path: string;
}

export interface MaterialSearchDocument {
  id: string;
  name: string;
  recording_id: number;
  category_id: number;
}

export type SearchDocument =
  | RecordingSearchDocument
  | CategorySearchDocument
  | MaterialSearchDocument;

export interface RecordingSearchFilters {
  category_id?: number;
  category_ids?: number[];
  category_path?: string;
  speaker_ids?: number[];
  lang_ids?: number[];
  venues_id?: number;
  event_id?: number;
  date_start?: string;
  date_end?: string;
}

export interface SearchPayload {
  term: string;
  targets: SearchTarget[];
  reqId: string;
  filters?: RecordingSearchFilters;
}

export interface SearchResult {
  target: SearchTarget;
  hits: SearchDocument[];
}

export type SyncChangedIds = Record<SearchableTable, number[]>;

export interface SyncNewAdditions {
  recordings: number[];
  materials: number[];
  categories: number[];
  replies: string[];
  requests: string[];
}

export interface SyncResult {
  changedCategoryPaths: string[];
  changedIds: SyncChangedIds;
  newAdditions: SyncNewAdditions;
  rebuildSearchIndex: boolean;
  changedTables: string[];
  clearedUser?: boolean;
  clearedRole?: boolean;
}

export interface NotificationGroup {
  id: string;
  type: "recordings" | "materials" | "categories" | "replies" | "requests";
  timestamp: string;
  itemIds: (number | string)[];
  readItemIds: (number | string)[];
}

export interface ResolvedNotificationItem {
  id: number | string;
  title: string;
  subtitle?: string;
  url: string;
  timestamp: string;
  read: boolean;
}

export interface ResolvedNotificationGroup {
  id: string;
  type: NotificationGroup["type"];
  title: string;
  timestamp: string;
  unreadCount: number;
  items: ResolvedNotificationItem[];
}

export type UserProfile = DB_TABLE<"users">;
export type UserEditRequest = DB_TABLE<"user_edit_requests">;

export interface AudioCacheLedgerEntry {
  id: string; // audio_id
  recId: number;
  accessedAt: number;
  size: number;
}

export type SyncTable = keyof typeof import("@/constants").SYNC_COLUMNS;
export type ClientWatermarks = Record<string, string>;

export interface SyncRequestBody {
  isPublic?: boolean;
  watermarks: ClientWatermarks;
}

export interface SyncResponseData {
  changed: boolean;
  sync_meta: Record<string, string>;
  deltas: Partial<Record<SyncTable, unknown[]>>;
}

export type SyncWorkerMessage =
  | (SyncResult & { type: typeof WORKER_MSG.SUCCESS; jobId?: string })
  | { type: typeof WORKER_MSG.ERROR; message: string; jobId?: string }
  | { type: typeof WORKER_MSG.PROGRESS; message: string; jobId?: string };
