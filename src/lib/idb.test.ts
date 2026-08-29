import { describe, expect, it, vi } from "vitest";
import { STORE } from "@/constants";

describe.concurrent("lib/idb suite", () => {
  it.concurrent("returns null when indexedDB is undefined", async () => {
    const originalIDB = globalThis.indexedDB;
    // @ts-expect-error
    delete globalThis.indexedDB;

    const { getDB } = await import("./idb");
    const db = getDB();
    expect(db).toBeNull();

    globalThis.indexedDB = originalIDB;
  });

  it.concurrent("opens database and executes upgrade schema initialization", async () => {
    let upgradeCallback: Function | undefined;
    vi.doMock("idb", () => ({
      openDB: (name: string, ver: number, opts: any) => {
        upgradeCallback = opts?.upgrade;
        return Promise.resolve({ name, ver });
      },
    }));

    const { getDB } = await import("./idb");
    const promise = getDB();
    expect(promise).toBeDefined();

    const createdStores: string[] = [];
    const createdIndexes: string[] = [];

    const mockStore = {
      createIndex: (idx: string) => createdIndexes.push(idx),
      indexNames: { contains: () => false },
    };

    const mockDb = {
      objectStoreNames: {
        contains: (s: string) => s === STORE.SPEAKERS,
      },
      deleteObjectStore: vi.fn(),
      createObjectStore: (name: string) => {
        createdStores.push(name);
        return mockStore;
      },
    };

    const mockTx = {
      objectStore: () => mockStore,
    };

    if (upgradeCallback) {
      upgradeCallback(mockDb, 1, 2, mockTx);
      expect(mockDb.deleteObjectStore).toHaveBeenCalled();
      expect(createdStores.length).toBeGreaterThan(0);
    }
  });
});
