import { type IDBPDatabase, openDB } from "idb";
import { DB_NAME, DB_VERSION, INDEX, STORE } from "@/constants";
import type {
  AudioCacheLedgerEntry,
  Category,
  ContentType,
  Event,
  Faq,
  FaqCategory,
  FeaturedItem,
  FeaturedSection,
  Language,
  Material,
  QueryReply,
  Recording,
  Redirect,
  Service,
  Speaker,
  UserEditRequest,
  UserProfile,
  UserQuery,
  UserServiceInterest,
  Venue,
} from "@/types";

type StoreName = Exclude<
  (typeof STORE)[keyof typeof STORE],
  "deleted_records" | "restricted_records"
>;

export interface RSP_IDB {
  categories: {
    key: number;
    value: Category;
    indexes: {
      [INDEX.BY_URL]: string;
      [INDEX.BY_PATH]: string;
    };
  };
  recordings: {
    key: number;
    value: Recording;
    indexes: {
      [INDEX.BY_CATEGORY_ID]: number;
    };
  };
  materials: {
    key: number;
    value: Material;
    indexes: {
      [INDEX.BY_RECORDING_ID]: number;
    };
  };
  speakers: {
    key: number;
    value: Speaker;
  };
  languages: {
    key: number;
    value: Language;
  };
  content_types: {
    key: number;
    value: ContentType;
  };
  venues: {
    key: number;
    value: Venue;
  };
  services: {
    key: number;
    value: Service;
  };
  redirects: {
    key: string;
    value: Redirect;
  };
  events: {
    key: number;
    value: Event;
  };
  faq_categories: {
    key: number;
    value: FaqCategory;
  };
  faqs: {
    key: number;
    value: Faq;
    indexes: { [INDEX.BY_CATEGORY_ID]: number };
  };
  featured_sections: {
    key: number;
    value: FeaturedSection;
  };
  featured_items: {
    key: number;
    value: FeaturedItem;
    indexes: { [INDEX.BY_SECTION_ID]: number };
  };
  users: {
    key: string;
    value: UserProfile;
  };
  user_edit_requests: {
    key: string;
    value: UserEditRequest;
  };
  user_service_interests: {
    key: string;
    value: UserServiceInterest;
  };
  user_queries: {
    key: string;
    value: UserQuery;
  };
  query_replies: {
    key: string;
    value: QueryReply;
    indexes: {
      [INDEX.BY_QUERY_ID]: string;
    };
  };
  sync_meta: {
    key: StoreName;
    value: { id: string; updated_at: string };
  };
  role_sync_meta: {
    key: StoreName;
    value: { id: string; updated_at: string };
  };
  role_meta: {
    key: string;
    value: string;
  };
  [STORE.CACHE_LEDGER]: {
    key: string;
    value: AudioCacheLedgerEntry;
  };
}

let dbPromise: Promise<IDBPDatabase<RSP_IDB>> | null = null;

const IDB_SCHEMA: Record<
  StoreName,
  { keyPath?: string; indexes?: { name: string; keyPath: string }[] }
> = {
  [STORE.CATEGORIES]: {
    keyPath: "id",
    indexes: [
      { name: INDEX.BY_URL, keyPath: "url_path" },
      { name: INDEX.BY_PATH, keyPath: "path" },
    ],
  },
  [STORE.RECORDINGS]: {
    keyPath: "id",
    indexes: [{ name: INDEX.BY_CATEGORY_ID, keyPath: "category_id" }],
  },
  [STORE.MATERIALS]: {
    keyPath: "id",
    indexes: [{ name: INDEX.BY_RECORDING_ID, keyPath: "recording_id" }],
  },
  [STORE.SPEAKERS]: {
    keyPath: "id",
  },
  [STORE.LANGUAGES]: {
    keyPath: "id",
  },
  [STORE.CONTENT_TYPES]: {
    keyPath: "id",
  },
  [STORE.VENUES]: {
    keyPath: "id",
  },
  [STORE.SERVICES]: {
    keyPath: "id",
  },
  [STORE.REDIRECTS]: {
    keyPath: "id",
  },
  [STORE.EVENTS]: {
    keyPath: "id",
  },
  [STORE.FAQ_CATEGORIES]: {
    keyPath: "id",
  },
  [STORE.FAQS]: {
    keyPath: "id",
    indexes: [{ name: INDEX.BY_CATEGORY_ID, keyPath: "category_id" }],
  },
  [STORE.FEATURED_SECTIONS]: {
    keyPath: "id",
  },
  [STORE.FEATURED_ITEMS]: {
    keyPath: "id",
    indexes: [{ name: INDEX.BY_SECTION_ID, keyPath: "section_id" }],
  },
  [STORE.SYNC_META]: {
    keyPath: "id",
  },
  [STORE.ROLE_SYNC_META]: {
    keyPath: "id",
  },
  [STORE.ROLE_META]: {},
  [STORE.CACHE_LEDGER]: {
    keyPath: "id",
    // indexes: [{ name: INDEX.BY_ACCESSED_AT, keyPath: "accessedAt" }],
  },
  [STORE.USERS]: {
    keyPath: "id",
  },
  [STORE.USER_EDIT_REQUESTS]: {
    keyPath: "id",
  },
  [STORE.USER_SERVICE_INTERESTS]: {
    keyPath: "id",
  },
  [STORE.USER_QUERIES]: {
    keyPath: "id",
  },
  [STORE.QUERY_REPLIES]: {
    keyPath: "id",
    indexes: [{ name: INDEX.BY_QUERY_ID, keyPath: "query_id" }],
  },
};

export const getDB = () => {
  if (typeof indexedDB === "undefined") return null;

  if (dbPromise) return dbPromise;

  dbPromise = openDB<RSP_IDB>(DB_NAME, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (oldVersion !== newVersion) {
        Object.values(STORE).forEach((store) => {
          try {
            db.deleteObjectStore(store);
          } catch {
            // Ignore error if store doesn't exist
          }
        });
      }

      Object.entries(IDB_SCHEMA).forEach(
        ([storeName, { keyPath, indexes }]) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, {
              keyPath,
            });
            indexes?.forEach((index) => {
              store.createIndex(index.name, index.keyPath);
            });
          } else {
            const store = transaction.objectStore(storeName);
            indexes?.forEach((index) => {
              if (!store.indexNames.contains(index.name)) {
                store.createIndex(index.name, index.keyPath);
              }
            });
          }
        },
      );
    },
  });

  return dbPromise;
};
