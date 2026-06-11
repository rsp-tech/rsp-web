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
  Material,
  Recording,
  Redirect,
  Service,
  Speaker,
  Venue,
} from "@/types";

export interface RSPDatabase {
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
  metadata: {
    key: string;
    value: unknown;
  };
}

let dbPromise: Promise<IDBPDatabase<RSPDatabase>> | null = null;

export const getDB = () => {
  if (typeof indexedDB === "undefined") return null;

  if (dbPromise) return dbPromise;

  dbPromise = openDB<RSPDatabase>(DB_NAME, DB_VERSION, {
    upgrade(db, _oldVersion, _newVersion, transaction) {
      if (!db.objectStoreNames.contains(STORE.CATEGORIES)) {
        const store = db.createObjectStore(STORE.CATEGORIES, { keyPath: "id" });
        store.createIndex(INDEX.BY_PATH, "path");
        store.createIndex(INDEX.BY_URL, "url_path");
      } else {
        const store = transaction.objectStore(STORE.CATEGORIES);
        if (!store.indexNames.contains(INDEX.BY_URL)) {
          store.createIndex(INDEX.BY_URL, "url_path");
        }
        if (!store.indexNames.contains(INDEX.BY_PATH)) {
          store.createIndex(INDEX.BY_PATH, "path");
        }
      }

      if (!db.objectStoreNames.contains(STORE.RECORDINGS)) {
        const store = db.createObjectStore(STORE.RECORDINGS, { keyPath: "id" });
        store.createIndex(INDEX.BY_CATEGORY_ID, "category_id");
      } else {
        const store = transaction.objectStore(STORE.RECORDINGS);
        if (!store.indexNames.contains(INDEX.BY_CATEGORY_ID)) {
          store.createIndex(INDEX.BY_CATEGORY_ID, "category_id");
        }
      }

      if (!db.objectStoreNames.contains(STORE.MATERIALS)) {
        const store = db.createObjectStore(STORE.MATERIALS, { keyPath: "id" });
        store.createIndex(INDEX.BY_RECORDING_ID, "recording_id");
      } else {
        const store = transaction.objectStore(STORE.MATERIALS);
        if (!store.indexNames.contains(INDEX.BY_RECORDING_ID)) {
          store.createIndex(INDEX.BY_RECORDING_ID, "recording_id");
        }
      }

      if (!db.objectStoreNames.contains(STORE.SPEAKERS)) {
        db.createObjectStore(STORE.SPEAKERS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE.LANGUAGES)) {
        db.createObjectStore(STORE.LANGUAGES, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE.CONTENT_TYPES)) {
        db.createObjectStore(STORE.CONTENT_TYPES, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE.VENUES)) {
        db.createObjectStore(STORE.VENUES, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE.SERVICES)) {
        db.createObjectStore(STORE.SERVICES, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE.REDIRECTS)) {
        db.createObjectStore(STORE.REDIRECTS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE.EVENTS)) {
        db.createObjectStore(STORE.EVENTS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE.FAQ_CATEGORIES)) {
        db.createObjectStore(STORE.FAQ_CATEGORIES, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE.FAQS)) {
        const store = db.createObjectStore(STORE.FAQS, { keyPath: "id" });
        store.createIndex(INDEX.BY_CATEGORY_ID, "category_id");
      }
      if (!db.objectStoreNames.contains(STORE.FEATURED_SECTIONS)) {
        db.createObjectStore(STORE.FEATURED_SECTIONS, { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains(STORE.FEATURED_ITEMS)) {
        const store = db.createObjectStore(STORE.FEATURED_ITEMS, {
          keyPath: "id",
        });
        store.createIndex(INDEX.BY_SECTION_ID, "section_id");
      }
      if (!db.objectStoreNames.contains(STORE.METADATA)) {
        db.createObjectStore(STORE.METADATA);
      }
    },
  });

  return dbPromise;
};
