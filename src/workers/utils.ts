import { unzipSync } from "fflate";
import type { IDBPDatabase } from "idb";
import {
  INVALIDATE_ALL_THRESHOLD,
  MAX_SYNC_STALE_DAYS,
  ONE_DAY_MS,
  ROLE_SYNCED_TABLES,
  SEARCH_LOOKUP_TABLES,
  STORE,
  STRING_KEY_TABLES,
  SYNC_COLUMNS,
  USER_SPECIFIC_TABLES,
} from "@/constants";
import type { RSP_IDB } from "@/lib/idb";
import { parseCSVTable, stripUpdatedAt, toCSVRows } from "@/lib/sync-utils";
import type {
  Category,
  DeletedRecord,
  Material,
  Recording,
  SyncChangedIds,
  SyncNewAdditions,
  SyncResponseData,
  SyncResult,
  SyncTable,
} from "@/types";

type TableName = (typeof STORE)[keyof typeof STORE];

export type IDBTable = Exclude<
  TableName,
  | "sync_meta"
  | "role_meta"
  | "cache_ledger"
  | "deleted_records"
  | "restricted_records"
>;

type SyncRow = (RSP_IDB[IDBTable]["value"] | DeletedRecord) & {
  created_at?: string | null;
  category_id?: number;
  recording_id?: number;
  url_path?: string;
  path?: string;
};

export interface ChangedCategoryMeta {
  changedCategories: Record<number, string>; // [id]: url_path
  bubbledChangeCategoryIds: Set<number>;
  changedRecordings: Record<number, number>; // [id]: category_id
  bubbledChangeRecordingIds: Set<number>;
}

export const createInitialSyncState = (): {
  changedCategoryMeta: ChangedCategoryMeta;
  changedIds: SyncChangedIds;
  newAdditions: SyncNewAdditions;
} => ({
  changedCategoryMeta: {
    changedCategories: {},
    changedRecordings: {},
    bubbledChangeCategoryIds: new Set(),
    bubbledChangeRecordingIds: new Set(),
  },
  changedIds: {
    categories: [],
    recordings: [],
    materials: [],
  },
  newAdditions: {
    recordings: [],
    materials: [],
    categories: [],
    replies: [],
    requests: [],
  },
});

interface WriteRowsConfig {
  db: IDBPDatabase<RSP_IDB>;
  table: IDBTable;
  rows: SyncRow[];
  changedIds: SyncChangedIds;
  changedCategoryMeta: ChangedCategoryMeta;
  newAdditions: SyncNewAdditions;
  idbLastSync?: string;
}

const parseRecordKey = (
  table: string,
  recordId: string,
): number | string | undefined => {
  if (STRING_KEY_TABLES.has(table)) {
    return recordId;
  }
  const numericId = Number(recordId);
  return Number.isSafeInteger(numericId) ? numericId : undefined;
};

const parseCategoryIdFromPath = (path?: string): number | undefined => {
  if (!path) return;
  const categoryId = Number(path.split(".").pop());
  return Number.isSafeInteger(categoryId) ? categoryId : undefined;
};

export const applyDeletedRecords = async (
  db: IDBPDatabase<RSP_IDB>,
  deletedRows: DeletedRecord[],
  changedIds: SyncChangedIds,
  changedCategoryMeta: ChangedCategoryMeta,
): Promise<void> => {
  for (const { table_name, record_id } of deletedRows) {
    if (!table_name || !record_id) continue;
    const targetStore = table_name as keyof RSP_IDB;
    if (!db.objectStoreNames.contains(targetStore)) continue;

    const key = parseRecordKey(table_name, record_id);
    if (key === undefined || key === "") continue;

    const tx = db.transaction(targetStore, "readwrite");

    switch (table_name) {
      case STORE.RECORDINGS: {
        if (typeof key !== "number") break;
        const existing = (await tx.store.get(key)) as Recording | undefined;

        if (existing?.category_id) {
          changedCategoryMeta.changedRecordings[key] = existing.category_id;
          changedCategoryMeta.bubbledChangeCategoryIds.add(
            existing.category_id,
          );
        }

        changedIds.recordings.push(key);
        break;
      }

      case STORE.CATEGORIES: {
        if (typeof key !== "number") break;
        const existing = (await tx.store.get(key)) as Category | undefined;

        if (existing) {
          changedCategoryMeta.changedCategories[key] = existing.url_path ?? "";

          const categoryId = parseCategoryIdFromPath(existing.path);
          if (categoryId !== undefined) {
            changedCategoryMeta.bubbledChangeCategoryIds.add(categoryId);
          }
        }

        changedIds.categories.push(key);
        break;
      }

      case STORE.MATERIALS: {
        if (typeof key !== "number") break;
        const existing = (await tx.store.get(key)) as Material | undefined;

        if (existing?.recording_id != null) {
          changedCategoryMeta.bubbledChangeRecordingIds.add(
            existing.recording_id,
          );
        }

        changedIds.materials.push(key);
        break;
      }
    }

    await tx.store.delete(key);
    await tx.done;
  }
};

const writeRowsToStore = async ({
  db,
  table,
  rows,
  changedIds,
  changedCategoryMeta,
  newAdditions,
  idbLastSync,
}: WriteRowsConfig): Promise<void> => {
  const tx = db.transaction(table, "readwrite");
  const isIncrementalSync = Boolean(idbLastSync);

  for (const row of rows) {
    const key = STRING_KEY_TABLES.has(table) ? String(row.id) : Number(row.id);
    const existing = isIncrementalSync ? await tx.store.get(key) : true;
    const isNew = isIncrementalSync && !existing;

    await tx.store.put(row);

    switch (table) {
      case STORE.CATEGORIES:
        changedIds.categories.push(row.id as number);
        changedCategoryMeta.changedCategories[row.id as number] =
          row.url_path as string;
        changedCategoryMeta.bubbledChangeCategoryIds.add(
          Number(row.path?.split(".").pop()),
        );
        if (isNew && newAdditions) {
          newAdditions.categories.push(row.id as number);
        }
        break;
      case STORE.RECORDINGS:
        changedIds.recordings.push(row.id as number);
        changedCategoryMeta.changedRecordings[row.id as number] =
          row.category_id as number;
        changedCategoryMeta.bubbledChangeCategoryIds.add(
          row.category_id as number,
        );
        if (isNew && newAdditions) {
          newAdditions.recordings.push(row.id as number);
        }
        break;
      case STORE.MATERIALS:
        changedIds.materials.push(row.id as number);
        changedCategoryMeta.bubbledChangeRecordingIds.add(
          row.recording_id as number,
        );
        if (isNew && newAdditions) {
          newAdditions.materials.push(row.id as number);
        }
        break;
      case STORE.QUERY_REPLIES:
        if (isNew && newAdditions) {
          newAdditions.replies.push(String(row.id));
        }
        break;
      case STORE.USER_EDIT_REQUESTS:
        if (isNew && newAdditions) {
          newAdditions.requests.push(String(row.id));
        }
        break;
    }
  }
  await tx.done;
};

const writeUnzippedTablesToDb = async (
  db: IDBPDatabase<RSP_IDB>,
  unzipped: ReturnType<typeof unzipSync>,
  tables: readonly SyncTable[],
  clearStore = false,
) => {
  const txs: Promise<void>[] = [];
  for (const table of tables) {
    if (table === STORE.DELETED_RECORDS || table === STORE.RESTRICTED_RECORDS) {
      continue;
    }
    const records = parseCSVTable<Record<string, unknown>>(
      toCSVRows(unzipped, table),
      table,
    );
    const cleanRecords = stripUpdatedAt(records);

    const tx = db.transaction(table, "readwrite");
    if (clearStore) {
      await tx.store.clear();
    }
    for (const record of cleanRecords) {
      tx.store.put(record);
    }
    txs.push(tx.done);
  }

  await Promise.all(txs);
};

export const syncCacheAndIDB = async (db: IDBPDatabase<RSP_IDB>) => {
  if (typeof self.caches === "undefined") return;
  try {
    const cache = await self.caches.open("rsp-audio-cache");
    const keys = await cache.keys();
    for (const req of keys) {
      const audioId = new URL(req.url).pathname.split("/").pop() || "";
      if (!audioId) continue;

      const ledgerEntry = await db.get(STORE.CACHE_LEDGER, audioId);
      if (!ledgerEntry) {
        const tx = db.transaction(STORE.RECORDINGS, "readonly");
        let cursor = await tx.store.openCursor();
        let recId: number | null = null;
        while (cursor) {
          if (cursor.value.audio_id === audioId) {
            recId = cursor.value.id;
            break;
          }
          cursor = await cursor.continue();
        }

        if (recId !== null) {
          const cachedResponse = await cache.match(req);
          let size = 0;
          if (cachedResponse) {
            const contentLength = cachedResponse.headers.get("content-length");
            if (contentLength) {
              size = parseInt(contentLength, 10);
            } else {
              const blob = await cachedResponse.clone().blob();
              size = blob.size;
            }
          }

          await db.put(STORE.CACHE_LEDGER, {
            id: audioId,
            recId,
            accessedAt: Date.now(),
            size,
          });
        }
      }
    }
  } catch (cacheErr) {
    console.error("Failed to sync cache ledger entries in worker:", cacheErr);
  }
};

export const loadStaticZipSeedsForRole = async (
  db: IDBPDatabase<RSP_IDB>,
  origin: string,
  roleId: number,
  accessToken: string,
) => {
  const zipRes = await fetch(`${origin}/api/sync/${roleId}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!zipRes.ok) return false;
  const unzipped = unzipSync(new Uint8Array(await zipRes.arrayBuffer()));
  await writeUnzippedTablesToDb(db, unzipped, ROLE_SYNCED_TABLES, false);

  const syncStateBytes = unzipped["sync_state.json"];
  if (syncStateBytes) {
    const syncState = JSON.parse(
      new TextDecoder().decode(syncStateBytes),
    ) as Record<string, string>;

    const syncMetaTx = db.transaction(STORE.ROLE_SYNC_META, "readwrite");
    for (const [table, lastUpdated] of Object.entries(syncState)) {
      if (
        (ROLE_SYNCED_TABLES as readonly string[]).includes(table) &&
        lastUpdated
      ) {
        syncMetaTx.store.put({
          id: table,
          updated_at: lastUpdated,
        });
      }
    }
    await syncMetaTx.done;
  }

  return true;
};

export const loadUserSeeds = async (
  db: IDBPDatabase<RSP_IDB>,
  origin: string,
  accessToken: string,
): Promise<boolean> => {
  const userRes = await fetch(`${origin}/api/sync/user`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!userRes.ok) return false;
  const { sync_meta, ...userTables } = (await userRes.json()) as {
    sync_meta: Record<string, string>;
  } & Record<string, RSP_IDB[IDBTable]["value"][]>;

  const txs: Promise<void>[] = [];

  for (const [table, rows] of Object.entries(userTables)) {
    if (!Array.isArray(rows) || !rows.length) {
      continue;
    }

    const cleanRows =
      table === STORE.QUERY_REPLIES
        ? rows
        : stripUpdatedAt(
            rows as Array<
              RSP_IDB[IDBTable]["value"] & { updated_at?: unknown }
            >,
          );
    const tx = db.transaction(table as IDBTable, "readwrite");
    for (const record of cleanRows) {
      tx.store.put(record as RSP_IDB[IDBTable]["value"]);
    }
    txs.push(tx.done);
  }
  await Promise.all(txs);

  const syncMetaTx = db.transaction(STORE.SYNC_META, "readwrite");
  for (const table of USER_SPECIFIC_TABLES) {
    const watermark = sync_meta[table];
    if (watermark) {
      syncMetaTx.store.put({
        id: table,
        updated_at: watermark,
      });
    }
  }
  await syncMetaTx.done;

  return true;
};

export const isDatabaseStale = async (
  db: IDBPDatabase<RSP_IDB>,
  serverMeta: Record<string, string>,
): Promise<boolean> => {
  const recMeta = await db.get(STORE.SYNC_META, STORE.RECORDINGS);
  const clientRecTime = recMeta?.updated_at;
  const serverRecTime = serverMeta[STORE.RECORDINGS];

  // 1. Missing client or server watermark -> stale (needs seed)
  if (!clientRecTime || !serverRecTime) {
    return true;
  }

  // 2. If client and server watermarks match, database is up-to-date -> not stale
  if (clientRecTime === serverRecTime) {
    return false;
  }

  // 3. If watermarks differ, check if client data is older than MAX_SYNC_STALE_DAYS from now
  const recSyncDay = Math.floor(Date.parse(clientRecTime) / ONE_DAY_MS);
  return (
    Number.isNaN(recSyncDay) ||
    Math.floor(Date.now() / ONE_DAY_MS) - recSyncDay > MAX_SYNC_STALE_DAYS
  );
};

export const loadStaticZipSeeds = async (
  db: IDBPDatabase<RSP_IDB>,
  origin: string,
): Promise<boolean> => {
  const zipRes = await fetch(`${origin}/api/sync`);
  if (!zipRes.ok) return false;

  const unzipped = unzipSync(new Uint8Array(await zipRes.arrayBuffer()));

  const syncStateBytes = unzipped["sync_state.json"];
  if (!syncStateBytes) {
    throw new Error("sync_state.json not found in sync.zip");
  }

  const syncState = JSON.parse(
    new TextDecoder().decode(syncStateBytes),
  ) as Record<string, string>;

  const tables = (Object.keys(SYNC_COLUMNS) as SyncTable[]).filter(
    (t) => t !== STORE.DELETED_RECORDS,
  );
  await writeUnzippedTablesToDb(db, unzipped, tables, true);

  // Write updated_at watermarks to sync_meta
  const syncMetaTx = db.transaction(STORE.SYNC_META, "readwrite");
  for (const [table, lastUpdated] of Object.entries(syncState)) {
    if (
      ((tables as readonly string[]).includes(table) ||
        table === STORE.DELETED_RECORDS) &&
      lastUpdated
    ) {
      syncMetaTx.store.put({
        id: table,
        updated_at: lastUpdated,
      });
    }
  }
  await syncMetaTx.done;

  return true;
};

export const fetchPublicSyncDeltas = async (
  origin: string,
  watermarks: Record<string, string>,
): Promise<SyncResponseData | null> => {
  const query = new URLSearchParams(watermarks).toString();
  const res = await fetch(`${origin}/api/sync?${query}`);

  if (!res.ok) {
    throw new Error(
      `Public sync failed with status ${res.status}: ${res.statusText}`,
    );
  }

  return (await res.json()) as SyncResponseData;
};

export const fetchRoleSyncDeltas = async (
  origin: string,
  watermarks: Record<string, string>,
  accessToken: string,
): Promise<SyncResponseData | null> => {
  const res = await fetch(`${origin}/api/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      watermarks,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `Role sync failed with status ${res.status}: ${res.statusText}`,
    );
  }

  return (await res.json()) as SyncResponseData;
};

export const fetchUserSyncDeltas = async (
  origin: string,
  watermarks: Record<string, string>,
  accessToken: string,
): Promise<SyncResponseData | null> => {
  const res = await fetch(`${origin}/api/sync/user`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      watermarks,
    }),
  });

  if (!res.ok) {
    throw new Error(
      `User sync failed with status ${res.status}: ${res.statusText}`,
    );
  }

  return (await res.json()) as SyncResponseData;
};

export const mergeDeltas = (
  publicDeltas?: Partial<Record<SyncTable, unknown[]>>,
  roleDeltas?: Partial<Record<SyncTable, unknown[]>>,
): Partial<Record<SyncTable, unknown[]>> => {
  const merged: Partial<Record<SyncTable, unknown[]>> = {};

  if (publicDeltas) {
    for (const [table, rows] of Object.entries(publicDeltas)) {
      if (rows?.length) {
        merged[table as SyncTable] = [...rows];
      }
    }
  }

  if (roleDeltas) {
    for (const [table, rows] of Object.entries(roleDeltas)) {
      if (!rows?.length) continue;
      const syncTable = table as SyncTable;
      const existing = (merged[syncTable] || []) as Array<
        Record<string, unknown>
      >;
      const map = new Map<unknown, Record<string, unknown>>();

      for (const r of existing) {
        const key = r["id"] ?? r["record_id"];
        if (key !== undefined) map.set(key, r);
      }

      for (const r of rows as Array<Record<string, unknown>>) {
        const key = r["id"] ?? r["record_id"];
        if (key !== undefined) map.set(key, r);
      }

      merged[syncTable] = Array.from(map.values());
    }
  }

  return merged;
};

export const applyDeltas = async (
  db: IDBPDatabase<RSP_IDB>,
  deltas: Partial<Record<SyncTable, unknown[]>>,
  syncMeta: Record<string, string>,
  watermarks: Record<string, string>,
  changedIds: SyncChangedIds,
  changedCategoryMeta: ChangedCategoryMeta,
  newAdditions: SyncNewAdditions,
  metaStore:
    | typeof STORE.SYNC_META
    | typeof STORE.ROLE_SYNC_META = STORE.SYNC_META,
): Promise<string[]> => {
  const changedTables: string[] = [];

  for (const [table, rows] of Object.entries(deltas)) {
    if (!rows?.length) continue;
    const syncTable = table as SyncTable;

    if (
      syncTable === STORE.DELETED_RECORDS ||
      syncTable === STORE.RESTRICTED_RECORDS
    ) {
      await applyDeletedRecords(
        db,
        rows as DeletedRecord[],
        changedIds,
        changedCategoryMeta,
      );
    } else {
      await writeRowsToStore({
        db,
        table: syncTable as IDBTable,
        rows: rows as RSP_IDB[IDBTable]["value"][],
        changedIds,
        changedCategoryMeta,
        newAdditions,
        idbLastSync: watermarks[syncTable],
      });
    }
    changedTables.push(syncTable);
  }

  // Determine latest watermarks to persist:
  // 1. Tables with changes are always updated.
  // 2. Tables without changes are updated if their local watermark is empty.

  const metaTx = db.transaction(metaStore, "readwrite");
  for (const [table, updated_at] of Object.entries(syncMeta)) {
    if (updated_at && (changedTables.includes(table) || !watermarks[table])) {
      metaTx.store.put({ id: table, updated_at });
    }
  }
  await metaTx.done;

  return changedTables;
};

export const toSyncResult = async (
  db: IDBPDatabase<RSP_IDB>,
  changedCategoryMeta: ChangedCategoryMeta,
  changedIds: SyncChangedIds,
  changedTables: string[],
  newAdditions: SyncNewAdditions,
  clearedUser?: boolean,
  clearedRole?: boolean,
  forceRebuildSearchIndex?: boolean,
): Promise<SyncResult> => {
  const rebuildSearchIndex =
    Boolean(forceRebuildSearchIndex) ||
    changedTables.some((table) =>
      (SEARCH_LOOKUP_TABLES as readonly string[]).includes(table),
    );
  const {
    changedCategories,
    changedRecordings,
    bubbledChangeCategoryIds,
    bubbledChangeRecordingIds,
  } = changedCategoryMeta;

  Object.keys(changedCategories).forEach((id) => {
    bubbledChangeCategoryIds.add(Number(id));
  });

  if (bubbledChangeCategoryIds.size <= INVALIDATE_ALL_THRESHOLD) {
    (
      await Promise.all(
        Array.from(bubbledChangeRecordingIds).map(
          async (id) =>
            changedRecordings[id] ??
            (
              await db.get(STORE.RECORDINGS, Number(id))
            )?.category_id,
        ),
      )
    ).forEach((id) => {
      if (id) bubbledChangeCategoryIds.add(id);
    });
  }

  const changedCategoryPaths =
    forceRebuildSearchIndex ||
    bubbledChangeCategoryIds.size > INVALIDATE_ALL_THRESHOLD
      ? ["*"]
      : await Promise.all(
          Array.from(bubbledChangeCategoryIds).map(async (id) =>
            id
              ? (changedCategories[id] ??
                (await db.get(STORE.CATEGORIES, id))?.url_path)
              : "~",
          ),
        );

  return {
    clearedUser,
    clearedRole,
    changedCategoryPaths: changedCategoryPaths.filter(
      (p): p is string => p !== undefined,
    ),
    changedIds: {
      recordings: Array.from(new Set(changedIds.recordings ?? [])),
      categories: Array.from(new Set(changedIds.categories ?? [])),
      materials: Array.from(new Set(changedIds.materials ?? [])),
    },
    newAdditions: {
      recordings: Array.from(new Set(newAdditions.recordings)),
      materials: Array.from(new Set(newAdditions.materials)),
      categories: Array.from(new Set(newAdditions.categories)),
      replies: Array.from(new Set(newAdditions.replies)),
      requests: Array.from(new Set(newAdditions.requests)),
    },
    changedTables,
    rebuildSearchIndex,
  };
};
