export interface AudioMeta {
  audioId: string;
  recId: string;
  sizeBytes: number;
  lastAccessed: number;
}

const DB_NAME = "audio_metadata_db";
const STORE_NAME = "cache_ledger";
const DB_VERSION = 1;
const CACHE_NAME = "rsp-audio-cache";

const openLedgerDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: "audioId" });
        store.createIndex("by_timestamp", "lastAccessed", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const touchTrackMeta = async (
  audioId: string,
  recId: string,
  sizeBytes: number,
): Promise<void> => {
  const db = await openLedgerDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const record: AudioMeta = {
      audioId,
      recId,
      sizeBytes,
      lastAccessed: Date.now(),
    };

    store.put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
};

export const enforceLRUWatermark = async (limitMB: number): Promise<void> => {
  const db = await openLedgerDB();
  const limitBytes = limitMB * 1024 * 1024;

  const entries = await new Promise<AudioMeta[]>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index("by_timestamp");
    const request = index.getAll();

    request.onsuccess = () => resolve(request.result as AudioMeta[]);
    request.onerror = () => reject(request.error);
  });

  let currentSize = entries.reduce((acc, curr) => acc + curr.sizeBytes, 0);
  if (currentSize <= limitBytes) return;

  const targetSize = limitBytes * 0.8; // 80% Low Watermark Headroom
  const cache = await caches.open(CACHE_NAME);

  for (const entry of entries) {
    if (currentSize <= targetSize) break;

    // Delete both from Browser Cache Storage and our Metadata database
    await cache.delete(entry.audioId);

    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(entry.audioId);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });

    currentSize -= entry.sizeBytes;
  }
};
