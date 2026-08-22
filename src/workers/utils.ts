import type { SupabaseClient } from "@supabase/supabase-js";
import { unzipSync } from "fflate";
import type { IDBPDatabase } from "idb";
import {
  MAX_SYNC_STALE_MS,
  ROLE_SYNCED_TABLES,
  STORE,
  STRING_KEY_TABLES,
  SYNC_COLUMNS,
  SYNC_PAGE_SIZE,
} from "@/constants";
import type { Database } from "@/database.types";
import type { RSP_IDB } from "@/lib/idb";
import { parseCSVTable, toCSVRows, toUpdatedAtMap } from "@/lib/sync-utils";
import type {
  Category,
  DeletedRecord,
  Material,
  Recording,
  SyncChangedIds,
  SyncNewAdditions,
} from "@/types";

type SupabaseProdClient = SupabaseClient<Database, "prod", "prod">;
type SyncMetaRow = {
  id: string;
  updated_at: string;
};

type SyncMetaMap = Record<string, string>;
type TableName = (typeof STORE)[keyof typeof STORE];
export type IDBTable = Exclude<
  TableName,
  "sync_meta" | "role_meta" | "cache_ledger" | "deleted_records"
>;
export type SyncTable = Exclude<
  TableName,
  "sync_meta" | "role_meta" | "cache_ledger"
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
export interface SyncTableConfig {
  supabase: SupabaseProdClient;
  db: IDBPDatabase<RSP_IDB>;
  table: SyncTable;
  changedIds: SyncChangedIds;
  changedCategoryMeta: ChangedCategoryMeta;
  newAdditions: SyncNewAdditions;
  idbLastSync?: string;
  lastSync?: string;
}

export const getTablesToSync = async (
  db: IDBPDatabase<RSP_IDB>,
  origin: string,
) => {
  const [idbRows, supaMetaRes] = await Promise.all([
    db.getAll(STORE.SYNC_META),
    fetch(`${origin}/api/sync/meta`),
  ]);

  if (supaMetaRes.status === 304) {
    return [];
  }

  if (!supaMetaRes.ok) {
    throw new Error(`Failed to fetch sync_meta: ${supaMetaRes.statusText}`);
  }

  const supaSyncMeta = (await supaMetaRes.json()) as SyncMetaMap;
  const idbSyncMeta = toUpdatedAtMap(idbRows);

  return Object.values(STORE)
    .filter(
      (table) =>
        !table.endsWith("_meta") &&
        table !== STORE.CACHE_LEDGER &&
        idbSyncMeta[table] !== supaSyncMeta[table],
    )
    .map((table) => ({
      table,
      lastSync: supaSyncMeta[table],
      idbLastSync: idbSyncMeta[table],
    })) as {
    table: SyncTable;
    lastSync: string | undefined;
    idbLastSync: string | undefined;
  }[];
};

export const fetchTableWatermark = async (
  supabase: SupabaseProdClient,
  table: SyncTable,
): Promise<string | null> => {
  const { data, error } = await supabase
    .from(table)
    .select("updated_at")
    .not("updated_at", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(`${table} watermark tracking failed: ${error.message}`);
  }
  return typeof data?.[0]?.updated_at === "string" ? data[0].updated_at : null;
};

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
) => {
  const txs: Promise<void>[] = [];
  for (const table of tables) {
    if (table === STORE.DELETED_RECORDS) continue;
    const records = parseCSVTable<RSP_IDB[IDBTable]["value"]>(
      toCSVRows(unzipped, table),
      table,
    );

    const tx = db.transaction(table, "readwrite");
    await tx.store.clear();
    for (const record of records) {
      tx.store.put(record);
    }
    txs.push(tx.done);
  }

  await Promise.all(txs);
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
  await writeUnzippedTablesToDb(db, unzipped, ROLE_SYNCED_TABLES);

  // Fetch user-specific tables from the new JSON endpoint and write to IndexedDB
  const userRes = await fetch(`${origin}/api/sync/user`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!userRes.ok) return false;
  const payload = await userRes.json();
  const txs: Promise<void>[] = [];

  for (const [table, rows] of Object.entries(
    payload as Record<string, string[][]>,
  )) {
    if (!rows?.length || table === STORE.DELETED_RECORDS) continue;

    const records = parseCSVTable<RSP_IDB[IDBTable]["value"]>(rows, table);
    const tx = db.transaction(table, "readwrite");
    for (const record of records) {
      tx.store.put(record);
    }
    txs.push(tx.done);
  }
  await Promise.all(txs);

  return true;
};

export const syncTable = async ({
  supabase,
  db,
  table,
  changedIds,
  idbLastSync,
  lastSync,
  changedCategoryMeta,
  newAdditions,
}: SyncTableConfig): Promise<string | boolean> => {
  const highWatermark =
    lastSync || (await fetchTableWatermark(supabase, table));

  if (!highWatermark) return false;
  if (
    idbLastSync &&
    new Date(idbLastSync).getTime() >= new Date(highWatermark).getTime()
  ) {
    return false;
  }

  let changedRows = 0;
  let from = 0;

  while (true) {
    let query = supabase
      .from(table)
      .select(SYNC_COLUMNS[table])
      .not("updated_at", "is", null)
      .lte("updated_at", highWatermark)
      .order("updated_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + SYNC_PAGE_SIZE);

    if (idbLastSync) query = query.gt("updated_at", idbLastSync);

    const { data, error } = await query;
    if (error) throw new Error(`${table} page fetch failed: ${error.message}`);
    if (!data?.length) break;

    const rows = data as unknown as SyncRow[];
    if (table === STORE.DELETED_RECORDS) {
      await applyDeletedRecords(
        db,
        rows as DeletedRecord[],
        changedIds,
        changedCategoryMeta,
      );
    } else {
      await writeRowsToStore({
        db,
        table: table as IDBTable,
        rows: rows as RSP_IDB[IDBTable]["value"][],
        changedIds,
        changedCategoryMeta,
        newAdditions,
        idbLastSync,
      });
    }
    changedRows += rows.length;

    if (rows.length < SYNC_PAGE_SIZE) break;
    from += SYNC_PAGE_SIZE;
  }

  await db.put(STORE.SYNC_META, { id: table, updated_at: highWatermark });

  return changedRows > 0 ? table : false;
};

export const isDatabaseStale = async (
  db: IDBPDatabase<RSP_IDB>,
): Promise<boolean> => {
  const idbMetaRows = await db.getAll(STORE.SYNC_META);
  const timestamps = idbMetaRows
    .map((row) => new Date(row.updated_at).getTime())
    .filter((time) => !Number.isNaN(time));
  if (timestamps.length === 0) return true;
  const latestSyncTime = Math.max(...timestamps);
  return Date.now() - latestSyncTime > MAX_SYNC_STALE_MS;
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
  await writeUnzippedTablesToDb(db, unzipped, tables);

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
