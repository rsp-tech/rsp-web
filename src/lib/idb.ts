import {
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
import { type IDBPDatabase, openDB } from "idb";

export interface RSPDatabase {
  categories: {
    key: number;
    value: Category;
    indexes: {
      "by-url": string;
      "by-path": string;
    };
  };
  recordings: {
    key: string;
    value: Recording;
    indexes: {
      "by-category_id": string;
    };
  };
  materials: {
    key: string;
    value: Material;
    indexes: {
      "by-recording_id": string;
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
    indexes: { "by-category_id": number };
  };
  featured_sections: {
    key: number;
    value: FeaturedSection;
  };
  featured_items: {
    key: number;
    value: FeaturedItem;
    indexes: { "by-section_id": number };
  };
  metadata: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = "rsp.com";
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<RSPDatabase>> | null = null;

export const getDB = () => {
  if (typeof indexedDB === "undefined") return null;

  if (dbPromise) return dbPromise;

  dbPromise = openDB<RSPDatabase>(DB_NAME, DB_VERSION, {
    upgrade(db, _oldVersion, _newVersion, transaction) {
      if (!db.objectStoreNames.contains("categories")) {
        const store = db.createObjectStore("categories", { keyPath: "id" });
        store.createIndex("by-path", "path");
        store.createIndex("by-url", "url_path");
      } else {
        const store = transaction.objectStore(
          "categories",
        ) as unknown as IDBObjectStore;
        if (!store.indexNames.contains("by-url")) {
          store.createIndex("by-url", "url_path");
        }
        if (!store.indexNames.contains("by-path")) {
          store.createIndex("by-path", "path");
        }
      }

      if (!db.objectStoreNames.contains("recordings")) {
        const store = db.createObjectStore("recordings", { keyPath: "id" });
        store.createIndex("by-category_id", "category_id");
      } else {
        const store = transaction.objectStore("recordings");
        if (!store.indexNames.contains("by-category_id")) {
          store.createIndex("by-category_id", "category_id");
        }
      }

      if (!db.objectStoreNames.contains("materials")) {
        const store = db.createObjectStore("materials", { keyPath: "id" });
        store.createIndex("by-recording_id", "recording_id");
      } else {
        const store = transaction.objectStore("materials");
        if (!store.indexNames.contains("by-recording_id")) {
          store.createIndex("by-recording_id", "recording_id");
        }
      }

      if (!db.objectStoreNames.contains("speakers")) {
        db.createObjectStore("speakers", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("languages")) {
        db.createObjectStore("languages", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("content_types")) {
        db.createObjectStore("content_types", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("venues")) {
        db.createObjectStore("venues", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("services")) {
        db.createObjectStore("services", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("redirects")) {
        db.createObjectStore("redirects", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("events")) {
        db.createObjectStore("events", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("faq_categories")) {
        db.createObjectStore("faq_categories", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("faqs")) {
        const store = db.createObjectStore("faqs", { keyPath: "id" });
        store.createIndex("by-category_id", "category_id");
      }
      if (!db.objectStoreNames.contains("featured_sections")) {
        db.createObjectStore("featured_sections", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("featured_items")) {
        const store = db.createObjectStore("featured_items", { keyPath: "id" });
        store.createIndex("by-section_id", "section_id");
      }
      if (!db.objectStoreNames.contains("metadata")) {
        db.createObjectStore("metadata");
      }
    },
  });

  return dbPromise;
};
