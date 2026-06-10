import type { Database } from "@/database.types";

export type Tables<T extends keyof Database["prod"]["Tables"]> =
  Database["prod"]["Tables"][T]["Row"];
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

export type Notification = {
  id: string;
  title: string;
  message: string;
  target_type: "all" | "roles" | "users";
  target_roles: number[] | null;
  target_users: string[] | null;
  created_at: string;
};

export type UserNotification = {
  id: string;
  user_id: string;
  notification_id: string | null;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
};

export type NotificationPayload = {
  title?: string;
  message?: string;
};

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
export type UserQuery = Tables<"user_queries">;

export type UserQueryWithUser = UserQuery & {
  users: { name: string | null; email: string } | null;
};

export interface EnrichedRecording extends Recording {
  speakers: Speaker[];
  venue: Venue | null;
  event: Event | null;
  languages: Language[];
  content_type: ContentType | null;
  materials: Material[];
}

export type SearchableTable = "recordings" | "categories" | "materials";
export type SearchTarget = SearchableTable;

export interface RecordingSearchDocument {
  id: string;
  name: string;
  speaker_names: string;
  venue_name: string;
  date: string;
  speaker_ids: number[];
  category_id: number;
  lang_ids: number[];
  venues_id: number;
}

export interface CategorySearchDocument {
  id: string;
  name: string;
  url_path: string;
}

export interface MaterialSearchDocument {
  id: string;
  name: string;
  recording_id: number;
}

export type SearchDocument =
  | RecordingSearchDocument
  | CategorySearchDocument
  | MaterialSearchDocument;

export interface RecordingSearchFilters {
  category_id?: number;
  speaker_ids?: number[];
  lang_ids?: number[];
  venues_id?: number;
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

export type SyncChangedIds = Partial<Record<SearchableTable, number[]>>;

export interface SyncResult {
  changedCategoryPaths: string[];
  changedIds: SyncChangedIds;
  rebuildSearchIndex: boolean;
}
