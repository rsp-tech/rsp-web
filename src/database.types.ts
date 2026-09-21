export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  prod: {
    Tables: {
      announcements: {
        Row: {
          allowed_roles: number[];
          badge_text: string | null;
          bg_gradient: string | null;
          category: string | null;
          cta_label: string | null;
          cta_url: string | null;
          end_date: string | null;
          id: number;
          is_active: boolean | null;
          is_annual_recurring: boolean | null;
          media_path: string | null;
          media_type: string | null;
          order_ind: number | null;
          start_date: string | null;
          subtitle: string | null;
          title: string;
          ui_props: Json | null;
          updated_at: string | null;
        };
        Insert: {
          allowed_roles?: number[];
          badge_text?: string | null;
          bg_gradient?: string | null;
          category?: string | null;
          cta_label?: string | null;
          cta_url?: string | null;
          end_date?: string | null;
          id?: never;
          is_active?: boolean | null;
          is_annual_recurring?: boolean | null;
          media_path?: string | null;
          media_type?: string | null;
          order_ind?: number | null;
          start_date?: string | null;
          subtitle?: string | null;
          title: string;
          ui_props?: Json | null;
          updated_at?: string | null;
        };
        Update: {
          allowed_roles?: number[];
          badge_text?: string | null;
          bg_gradient?: string | null;
          category?: string | null;
          cta_label?: string | null;
          cta_url?: string | null;
          end_date?: string | null;
          id?: never;
          is_active?: boolean | null;
          is_annual_recurring?: boolean | null;
          media_path?: string | null;
          media_type?: string | null;
          order_ind?: number | null;
          start_date?: string | null;
          subtitle?: string | null;
          title?: string;
          ui_props?: Json | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      banner_images: {
        Row: {
          description: string;
          id: number;
          updated_at: string | null;
        };
        Insert: {
          description: string;
          id?: number;
          updated_at?: string | null;
        };
        Update: {
          description?: string;
          id?: number;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      categories: {
        Row: {
          allowed_roles: number[];
          created_at: string | null;
          id: number;
          img_id: number | null;
          name: string;
          order_ind: number | null;
          path: unknown;
          updated_at: string | null;
          url_path: unknown;
        };
        Insert: {
          allowed_roles?: number[];
          created_at?: string | null;
          id?: number;
          img_id?: number | null;
          name: string;
          order_ind?: number | null;
          path: unknown;
          updated_at?: string | null;
          url_path: unknown;
        };
        Update: {
          allowed_roles?: number[];
          created_at?: string | null;
          id?: number;
          img_id?: number | null;
          name?: string;
          order_ind?: number | null;
          path?: unknown;
          updated_at?: string | null;
          url_path?: unknown;
        };
        Relationships: [
          {
            foreignKeyName: "categories_img_id_fkey";
            columns: ["img_id"];
            isOneToOne: false;
            referencedRelation: "images";
            referencedColumns: ["id"];
          },
        ];
      };
      content_types: {
        Row: {
          id: number;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      deleted_records: {
        Row: {
          id: number;
          record_id: string;
          table_name: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          record_id: string;
          table_name: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          record_id?: string;
          table_name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      events: {
        Row: {
          id: number;
          name: string;
          short_name: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          short_name?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          short_name?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      faq_categories: {
        Row: {
          created_at: string | null;
          id: number;
          name: string;
          order_ind: number | null;
          slug: string;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          name: string;
          order_ind?: number | null;
          slug: string;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          name?: string;
          order_ind?: number | null;
          slug?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      faqs: {
        Row: {
          answer: string;
          category_id: number;
          created_at: string | null;
          id: number;
          is_published: boolean | null;
          order_ind: number | null;
          question: string;
          updated_at: string | null;
        };
        Insert: {
          answer: string;
          category_id: number;
          created_at?: string | null;
          id?: never;
          is_published?: boolean | null;
          order_ind?: number | null;
          question: string;
          updated_at?: string | null;
        };
        Update: {
          answer?: string;
          category_id?: number;
          created_at?: string | null;
          id?: never;
          is_published?: boolean | null;
          order_ind?: number | null;
          question?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "faqs_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "faq_categories";
            referencedColumns: ["id"];
          },
        ];
      };
      feature_flags: {
        Row: {
          allowed_emails: string[] | null;
          allowed_roles: number[] | null;
          description: string | null;
          id: string;
          is_enabled: boolean;
          is_ga: boolean;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          allowed_emails?: string[] | null;
          allowed_roles?: number[] | null;
          description?: string | null;
          id: string;
          is_enabled?: boolean;
          is_ga?: boolean;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          allowed_emails?: string[] | null;
          allowed_roles?: number[] | null;
          description?: string | null;
          id?: string;
          is_enabled?: boolean;
          is_ga?: boolean;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      featured_items: {
        Row: {
          allowed_roles: number[];
          entity_id: number;
          entity_type: string | null;
          id: number;
          order_ind: number | null;
          section_id: number | null;
          updated_at: string | null;
        };
        Insert: {
          allowed_roles?: number[];
          entity_id: number;
          entity_type?: string | null;
          id?: number;
          order_ind?: number | null;
          section_id?: number | null;
          updated_at?: string | null;
        };
        Update: {
          allowed_roles?: number[];
          entity_id?: number;
          entity_type?: string | null;
          id?: number;
          order_ind?: number | null;
          section_id?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "featured_items_section_id_fkey";
            columns: ["section_id"];
            isOneToOne: false;
            referencedRelation: "featured_sections";
            referencedColumns: ["id"];
          },
        ];
      };
      featured_sections: {
        Row: {
          allowed_roles: number[];
          id: number;
          is_active: boolean | null;
          layout: string | null;
          order_ind: number | null;
          title: string;
          updated_at: string | null;
        };
        Insert: {
          allowed_roles?: number[];
          id?: never;
          is_active?: boolean | null;
          layout?: string | null;
          order_ind?: number | null;
          title: string;
          updated_at?: string | null;
        };
        Update: {
          allowed_roles?: number[];
          id?: never;
          is_active?: boolean | null;
          layout?: string | null;
          order_ind?: number | null;
          title?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      languages: {
        Row: {
          id: number;
          name: string;
          native_name: string | null;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          native_name?: string | null;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          native_name?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      materials: {
        Row: {
          allowed_roles: number[];
          id: number;
          name: string;
          recording_id: number;
          size: number | null;
          type: string | null;
          updated_at: string | null;
          uri: string;
        };
        Insert: {
          allowed_roles?: number[];
          id?: number;
          name: string;
          recording_id: number;
          size?: number | null;
          type?: string | null;
          updated_at?: string | null;
          uri: string;
        };
        Update: {
          allowed_roles?: number[];
          id?: number;
          name?: string;
          recording_id?: number;
          size?: number | null;
          type?: string | null;
          updated_at?: string | null;
          uri?: string;
        };
        Relationships: [
          {
            foreignKeyName: "materials_recording_id_fkey";
            columns: ["recording_id"];
            isOneToOne: false;
            referencedRelation: "recordings";
            referencedColumns: ["id"];
          },
        ];
      };
      query_replies: {
        Row: {
          attachments: Json;
          id: string;
          message: string;
          query_id: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          attachments?: Json;
          id?: string;
          message: string;
          query_id: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          attachments?: Json;
          id?: string;
          message?: string;
          query_id?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "query_replies_query_id_fkey";
            columns: ["query_id"];
            isOneToOne: false;
            referencedRelation: "user_queries";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "query_replies_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      recordings: {
        Row: {
          allowed_roles: number[];
          audio_id: string | null;
          category_id: number;
          created_at: string | null;
          event_id: number | null;
          id: number;
          lang_ids: number[] | null;
          name: string;
          order_ind: number | null;
          recorded_at: string | null;
          size: number | null;
          speaker_ids: number[] | null;
          type_id: number | null;
          updated_at: string | null;
          venues_id: number | null;
          yt_id: string | null;
        };
        Insert: {
          allowed_roles?: number[];
          audio_id?: string | null;
          category_id: number;
          created_at?: string | null;
          event_id?: number | null;
          id?: number;
          lang_ids?: number[] | null;
          name: string;
          order_ind?: number | null;
          recorded_at?: string | null;
          size?: number | null;
          speaker_ids?: number[] | null;
          type_id?: number | null;
          updated_at?: string | null;
          venues_id?: number | null;
          yt_id?: string | null;
        };
        Update: {
          allowed_roles?: number[];
          audio_id?: string | null;
          category_id?: number;
          created_at?: string | null;
          event_id?: number | null;
          id?: number;
          lang_ids?: number[] | null;
          name?: string;
          order_ind?: number | null;
          recorded_at?: string | null;
          size?: number | null;
          speaker_ids?: number[] | null;
          type_id?: number | null;
          updated_at?: string | null;
          venues_id?: number | null;
          yt_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "recordings_category_id_fkey";
            columns: ["category_id"];
            isOneToOne: false;
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recordings_event_id_fkey";
            columns: ["event_id"];
            isOneToOne: false;
            referencedRelation: "events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recordings_type_id_fkey";
            columns: ["type_id"];
            isOneToOne: false;
            referencedRelation: "content_types";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recordings_venues_id_fkey";
            columns: ["venues_id"];
            isOneToOne: false;
            referencedRelation: "venues";
            referencedColumns: ["id"];
          },
        ];
      };
      redirects: {
        Row: {
          id: string;
          to_path: string;
          updated_at: string | null;
        };
        Insert: {
          id: string;
          to_path: string;
          updated_at?: string | null;
        };
        Update: {
          id?: string;
          to_path?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      restricted_records: {
        Row: {
          id: number;
          record_id: string;
          table_name: string;
          updated_at: string;
        };
        Insert: {
          id?: never;
          record_id: string;
          table_name: string;
          updated_at?: string;
        };
        Update: {
          id?: never;
          record_id?: string;
          table_name?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          created_at: string | null;
          description: string | null;
          id: number;
          is_public: boolean | null;
          name: string;
          order_ind: number | null;
          type: string | null;
          updated_at: string | null;
        };
        Insert: {
          created_at?: string | null;
          description?: string | null;
          id?: number;
          is_public?: boolean | null;
          name: string;
          order_ind?: number | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Update: {
          created_at?: string | null;
          description?: string | null;
          id?: number;
          is_public?: boolean | null;
          name?: string;
          order_ind?: number | null;
          type?: string | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      speakers: {
        Row: {
          id: number;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      sync_meta: {
        Row: {
          id: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          updated_at: string;
        };
        Update: {
          id?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_edit_requests: {
        Row: {
          actor_id: string | null;
          actor_type: string | null;
          ashram: string | null;
          authority_email: string | null;
          authority_name: string | null;
          authority_relationship: string | null;
          created_at: string | null;
          id: string;
          name: string | null;
          phone: string | null;
          purpose: string | null;
          reason: string | null;
          requested_at: string | null;
          requested_role_id: number | null;
          review_comment: string | null;
          reviewed_at: string | null;
          reviewed_by: string | null;
          status: string;
          temple: string | null;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          actor_id?: string | null;
          actor_type?: string | null;
          ashram?: string | null;
          authority_email?: string | null;
          authority_name?: string | null;
          authority_relationship?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string | null;
          phone?: string | null;
          purpose?: string | null;
          reason?: string | null;
          requested_at?: string | null;
          requested_role_id?: number | null;
          review_comment?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status: string;
          temple?: string | null;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          actor_id?: string | null;
          actor_type?: string | null;
          ashram?: string | null;
          authority_email?: string | null;
          authority_name?: string | null;
          authority_relationship?: string | null;
          created_at?: string | null;
          id?: string;
          name?: string | null;
          phone?: string | null;
          purpose?: string | null;
          reason?: string | null;
          requested_at?: string | null;
          requested_role_id?: number | null;
          review_comment?: string | null;
          reviewed_at?: string | null;
          reviewed_by?: string | null;
          status?: string;
          temple?: string | null;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_edit_requests_actor_id_fkey";
            columns: ["actor_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_edit_requests_requested_role_id_fkey";
            columns: ["requested_role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_edit_requests_reviewed_by_fkey";
            columns: ["reviewed_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_edit_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_queries: {
        Row: {
          attachments: Json;
          category: string;
          created_at: string | null;
          guest_email: string | null;
          guest_name: string | null;
          id: string;
          message: string;
          status: string;
          subject: string;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          attachments?: Json;
          category: string;
          created_at?: string | null;
          guest_email?: string | null;
          guest_name?: string | null;
          id?: string;
          message: string;
          status?: string;
          subject: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          attachments?: Json;
          category?: string;
          created_at?: string | null;
          guest_email?: string | null;
          guest_name?: string | null;
          id?: string;
          message?: string;
          status?: string;
          subject?: string;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_queries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_responsibilities: {
        Row: {
          assigned_by: string | null;
          created_at: string | null;
          ended_at: string | null;
          id: string;
          scope: string | null;
          started_at: string | null;
          title: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          assigned_by?: string | null;
          created_at?: string | null;
          ended_at?: string | null;
          id?: string;
          scope?: string | null;
          started_at?: string | null;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          assigned_by?: string | null;
          created_at?: string | null;
          ended_at?: string | null;
          id?: string;
          scope?: string | null;
          started_at?: string | null;
          title?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_responsibilities_assigned_by_fkey";
            columns: ["assigned_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_responsibilities_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_service_assignments: {
        Row: {
          assigned_by: string | null;
          ended_at: string | null;
          id: string;
          notes: string | null;
          role: string | null;
          service_id: number | null;
          started_at: string | null;
          status: string | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          assigned_by?: string | null;
          ended_at?: string | null;
          id?: string;
          notes?: string | null;
          role?: string | null;
          service_id?: number | null;
          started_at?: string | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          assigned_by?: string | null;
          ended_at?: string | null;
          id?: string;
          notes?: string | null;
          role?: string | null;
          service_id?: number | null;
          started_at?: string | null;
          status?: string | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_service_assignments_assigned_by_fkey";
            columns: ["assigned_by"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_service_assignments_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_service_assignments_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_service_history: {
        Row: {
          action: string | null;
          created_at: string | null;
          id: string;
          metadata: Json | null;
          service_id: number | null;
          updated_at: string | null;
          user_id: string | null;
        };
        Insert: {
          action?: string | null;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          service_id?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Update: {
          action?: string | null;
          created_at?: string | null;
          id?: string;
          metadata?: Json | null;
          service_id?: number | null;
          updated_at?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_service_history_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_service_history_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_service_interests: {
        Row: {
          created_at: string | null;
          id: string;
          level: string | null;
          notes: string | null;
          service_id: number;
          updated_at: string | null;
          user_id: string;
        };
        Insert: {
          created_at?: string | null;
          id?: string;
          level?: string | null;
          notes?: string | null;
          service_id: number;
          updated_at?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string | null;
          id?: string;
          level?: string | null;
          notes?: string | null;
          service_id?: number;
          updated_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_service_interests_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "user_service_interests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      users: {
        Row: {
          ashram: string | null;
          authority_email: string | null;
          authority_name: string | null;
          authority_relationship: string | null;
          avatar_url: string | null;
          created_at: string | null;
          email: string;
          id: string;
          name: string | null;
          phone: string | null;
          purpose: string | null;
          role_id: number;
          status: string | null;
          temple: string | null;
          updated_at: string | null;
        };
        Insert: {
          ashram?: string | null;
          authority_email?: string | null;
          authority_name?: string | null;
          authority_relationship?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          email: string;
          id: string;
          name?: string | null;
          phone?: string | null;
          purpose?: string | null;
          role_id?: number;
          status?: string | null;
          temple?: string | null;
          updated_at?: string | null;
        };
        Update: {
          ashram?: string | null;
          authority_email?: string | null;
          authority_name?: string | null;
          authority_relationship?: string | null;
          avatar_url?: string | null;
          created_at?: string | null;
          email?: string;
          id?: string;
          name?: string | null;
          phone?: string | null;
          purpose?: string | null;
          role_id?: number;
          status?: string | null;
          temple?: string | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "users_role_id_fkey";
            columns: ["role_id"];
            isOneToOne: false;
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      venues: {
        Row: {
          id: number;
          name: string;
          updated_at: string | null;
        };
        Insert: {
          id?: number;
          name: string;
          updated_at?: string | null;
        };
        Update: {
          id?: number;
          name?: string;
          updated_at?: string | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      clear_trash: { Args: never; Returns: undefined };
      get_category_page_data: { Args: { p_url_path: string }; Returns: Json };
      is_admin: { Args: never; Returns: boolean };
      my_role: { Args: never; Returns: number };
      reset_prod_sequences: { Args: never; Returns: string };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  "public"
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  prod: {
    Enums: {},
  },
} as const;
