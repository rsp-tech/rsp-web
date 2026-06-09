import type { Database } from "@/database.types";

export type Tables<T extends keyof Database["prod"]["Tables"]> =
  Database["prod"]["Tables"][T]["Row"];
export type Enums<T extends keyof Database["prod"]["Enums"]> =
  Database["prod"]["Enums"][T];

export type Category = Tables<"categories">;
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
