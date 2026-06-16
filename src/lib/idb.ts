import { type IDBPDatabase, openDB } from "idb";
import { DB_NAME, DB_VERSION, INDEX, STORE } from "@/constants";
import type {
  Category,
  ContentType,
  Event,
  Faq,
  FaqCategory,
  FeaturedItem,
  FeaturedSection,
  Language,
  LocalTable,
  Material,
  Recording,
  Redirect,
  Service,
  Speaker,
  Venue,
} from "@/types";

type StoreName = (typeof STORE)[keyof typeof STORE];

export interface RSP_IDB {
  categories: {
    key: number;
    value: LocalTable<Category>;
    indexes: {
      [INDEX.BY_URL]: string;
      [INDEX.BY_PATH]: string;
    };
  };
  recordings: {
    key: number;
    value: LocalTable<Recording>;
    indexes: {
      [INDEX.BY_CATEGORY_ID]: number;
    };
  };
  materials: {
    key: number;
    value: LocalTable<Material>;
    indexes: {
      [INDEX.BY_RECORDING_ID]: number;
    };
  };
  speakers: {
    key: number;
    value: LocalTable<Speaker>;
  };
  languages: {
    key: number;
    value: LocalTable<Language>;
  };
  content_types: {
    key: number;
    value: LocalTable<ContentType>;
  };
  venues: {
    key: number;
    value: LocalTable<Venue>;
  };
  services: {
    key: number;
    value: LocalTable<Service>;
  };
  redirects: {
    key: string;
    value: LocalTable<Redirect>;
  };
  events: {
    key: number;
    value: LocalTable<Event>;
  };
  faq_categories: {
    key: number;
    value: LocalTable<FaqCategory>;
  };
  faqs: {
    key: number;
    value: LocalTable<Faq>;
    indexes: { [INDEX.BY_CATEGORY_ID]: number };
  };
  featured_sections: {
    key: number;
    value: LocalTable<FeaturedSection>;
  };
  featured_items: {
    key: number;
    value: LocalTable<FeaturedItem>;
    indexes: { [INDEX.BY_SECTION_ID]: number };
  };
  sync_meta: {
    key: StoreName;
    value: string /** Timestamp e.g., "2026-06-15T12:24:09.011502+00:00" */;
  };
  role_meta: {
    key: string;
    value: string;
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
  [STORE.SYNC_META]: {},
  [STORE.ROLE_META]: {},
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
