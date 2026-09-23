import type { IDBPDatabase } from "idb";
import type { RSP_IDB } from "@/lib/idb";

export type MockDbInitialData = Record<string, unknown>;

export interface MockDbOptions {
  initialData?: MockDbInitialData;
  [key: string]: unknown;
}

export const createMockDb = (
  optionsOrData: MockDbOptions = {},
): IDBPDatabase<RSP_IDB> => {
  const storeData = new Map<string, unknown>();

  const rawData: Record<string, unknown> =
    optionsOrData.initialData && typeof optionsOrData.initialData === "object"
      ? optionsOrData.initialData
      : optionsOrData;

  for (const [k, v] of Object.entries(rawData)) {
    if (k !== "initialData") {
      storeData.set(k, v);
    }
  }

  const mockDb = {
    getKey: (store: string, key: string | number) =>
      Promise.resolve(storeData.has(`${store}:${key}`) ? key : undefined),

    get: (store: string, key: string | number) =>
      Promise.resolve(storeData.get(`${store}:${key}`)),

    getAll: (store: string) => {
      const items: unknown[] = [];
      for (const [k, v] of storeData.entries()) {
        if (k.startsWith(`${store}:`)) {
          items.push(v);
        }
      }
      return Promise.resolve(items);
    },

    put: (store: string, val: unknown, key?: string | number) => {
      const recordKey =
        key ??
        (val && typeof val === "object" && "id" in val
          ? (val as { id: string | number }).id
          : undefined);
      storeData.set(`${store}:${recordKey}`, val);
      return Promise.resolve(recordKey);
    },

    delete: (store: string, key: string | number) => {
      storeData.delete(`${store}:${key}`);
      return Promise.resolve();
    },

    clear: (store?: string) => {
      if (store) {
        for (const k of Array.from(storeData.keys())) {
          if (k.startsWith(`${store}:`)) {
            storeData.delete(k);
          }
        }
      } else {
        storeData.clear();
      }
      return Promise.resolve();
    },

    transaction: (store: string | string[], _mode?: string) => {
      const targetStore = Array.isArray(store) ? store[0] : store;
      const getStoreOps = (s: string) => ({
        get: (key: string | number) => mockDb.get(s, key),
        getAll: () => mockDb.getAll(s),
        put: (val: unknown, key?: string | number) =>
          mockDb.put(s, val, key),
        delete: (key: string | number) => mockDb.delete(s, key),
        clear: () => mockDb.clear(s),
        openCursor: () => Promise.resolve(null),
      });
      return {
        store: getStoreOps(targetStore),
        objectStore: (s: string) => getStoreOps(s),
        done: Promise.resolve(),
      };
    },

    _rawStore: storeData,
  };

  return mockDb as unknown as IDBPDatabase<RSP_IDB>;
};
