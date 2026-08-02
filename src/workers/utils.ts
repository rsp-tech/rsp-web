import type { SupabaseClient } from "@supabase/supabase-js";
import { unzipSync } from "fflate";
import type { IDBPDatabase } from "idb";
import {
  ROLE_SYNCED_TABLES,
  STORE,
  SYNC_COLUMNS,
  SYNC_PAGE_SIZE,
} from "@/constants";
import type { Database } from "@/database.types";
import type { RSP_IDB } from "@/lib/idb";
import { parseCSVTable, toCSVRows } from "@/lib/sync-utils";
import type { SyncChangedIds } from "@/types";

type SupabaseProdClient = SupabaseClient<Database, "prod", "prod">;
type SyncMetaRow = {
  id: string;
  updated_at: string;
};

type SyncMetaMap = Record<string, string>;
type TableName = (typeof STORE)[keyof typeof STORE];
export type SyncTable = Exclude<
  TableName,
  "sync_meta" | "role_meta" | "cache_ledger"
>;
type SyncRow = RSP_IDB[SyncTable]["value"] & {
  created_at?: string | null;
  id: number | string;
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
  idbLastSync?: string;
  lastSync?: string;
}

const toUpdatedAtMap = (rows: SyncMetaRow[]): SyncMetaMap =>
  Object.fromEntries(rows.map((entry) => [entry.id, entry.updated_at]));

export const getTablesToSync = async (
  db: IDBPDatabase<RSP_IDB>,
  origin: string,
) => {
  const [idbRows, supaMetaRes] = await Promise.all([
    db.getAll(STORE.SYNC_META),
    fetch(`${origin}/api/sync/meta`),
  ]);

  if (!supaMetaRes.ok) {
    throw new Error(`Failed to fetch sync_meta: ${supaMetaRes.statusText}`);
  }

  const supaSyncMetaRows = (await supaMetaRes.json()) as SyncMetaRow[];

  const idbSyncMeta = toUpdatedAtMap(idbRows);
  const supaSyncMeta = toUpdatedAtMap(supaSyncMetaRows);

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
  table: SyncTable;
  rows: SyncRow[];
  changedIds: SyncChangedIds;
  changedCategoryMeta: ChangedCategoryMeta;
}

const writeRowsToStore = async ({
  db,
  table,
  rows,
  changedIds,
  changedCategoryMeta,
}: WriteRowsConfig): Promise<void> => {
  const tx = db.transaction(table, "readwrite");
  for (const row of rows) {
    tx.store.put(row);
    switch (table) {
      case STORE.CATEGORIES:
        changedIds.categories.push(row.id as number);
        changedCategoryMeta.changedCategories[row.id as number] =
          row.url_path as string;
        changedCategoryMeta.bubbledChangeCategoryIds.add(
          Number(row.path?.split(".").pop()),
        );
        break;
      case STORE.RECORDINGS:
        changedIds.recordings.push(row.id as number);
        changedCategoryMeta.changedRecordings[row.id as number] =
          row.category_id as number;
        changedCategoryMeta.bubbledChangeCategoryIds.add(
          row.category_id as number,
        );
        break;
      case STORE.MATERIALS:
        changedIds.materials.push(row.id as number);
        changedCategoryMeta.bubbledChangeRecordingIds.add(
          row.recording_id as number,
        );
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
    const records = parseCSVTable<RSP_IDB[SyncTable]["value"]>(
      toCSVRows(unzipped, table),
      table,
    );
    if (records.length === 0) continue;

    const tx = db.transaction(table, "readwrite");
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
    if (!rows?.length) continue;

    const records = parseCSVTable<RSP_IDB[SyncTable]["value"]>(rows, table);
    const tx = db.transaction(table as keyof RSP_IDB, "readwrite");
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
    await writeRowsToStore({
      db,
      table,
      rows,
      changedIds,
      changedCategoryMeta,
    });
    changedRows += rows.length;

    if (rows.length < SYNC_PAGE_SIZE) break;
    from += SYNC_PAGE_SIZE;
  }

  await db.put(STORE.SYNC_META, { id: table, updated_at: highWatermark });

  return changedRows > 0 ? table : false;
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

  const tables = Object.keys(SYNC_COLUMNS) as SyncTable[];
  await writeUnzippedTablesToDb(db, unzipped, tables);

  // Write updated_at watermarks to sync_meta
  const syncMetaTx = db.transaction(STORE.SYNC_META, "readwrite");
  for (const [table, lastUpdated] of Object.entries(syncState)) {
    if (tables.includes(table as SyncTable) && lastUpdated) {
      syncMetaTx.store.put({
        id: table as SyncTable,
        updated_at: lastUpdated,
      });
    }
  }
  await syncMetaTx.done;

  return true;
};
