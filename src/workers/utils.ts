import type { SupabaseClient } from "@supabase/supabase-js";
import type { IDBPDatabase } from "idb";
import {
  SEARCH_LOOKUP_TABLES,
  STORE,
  SYNC_COLUMNS,
  SYNC_PAGE_SIZE,
} from "@/constants";
import type { Database } from "@/database.types";
import type { RSP_IDB } from "@/lib/idb";
import type { SyncChangedIds } from "@/types";

type SupabaseProdClient = SupabaseClient<Database, "prod", "prod">;
type SyncMetaRow = {
  id: string;
  updated_at: string;
};

type SyncMetaMap = Record<string, string>;
type TableName = (typeof STORE)[keyof typeof STORE];
export type SyncTable = Exclude<TableName, "sync_meta" | "role_meta">;
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
  supabase: SupabaseProdClient,
) => {
  const [idbRows, supaResult] = await Promise.all([
    db.getAll(STORE.SYNC_META),
    supabase.from(STORE.SYNC_META).select("id, updated_at"),
  ]);

  if (supaResult.error) {
    throw new Error(supaResult.error.message);
  }

  const idbSyncMeta = toUpdatedAtMap(idbRows);
  const supaSyncMeta = toUpdatedAtMap(supaResult.data ?? []);

  return Object.values(STORE)
    .filter(
      (table) =>
        !table.endsWith("_meta") &&
        (!supaSyncMeta[table] || idbSyncMeta[table] !== supaSyncMeta[table]),
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

interface UpdateChangedMetaProps {
  table: SyncTable;
  changedCategoryMeta: ChangedCategoryMeta;
  changedIds: SyncChangedIds;
  row: SyncRow;
}

const updateChangedMeta = ({
  table,
  changedCategoryMeta,
  changedIds,
  row,
}: UpdateChangedMetaProps) => {
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
};

export const syncTableForRole = async ({
  supabase,
  db,
  table,
  roleId,
  changedIds,
  changedCategoryMeta,
}: SyncTableConfig & { roleId: number }): Promise<void> => {
  const highWatermark = await fetchTableWatermark(supabase, table);
  if (!highWatermark) return;

  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select(SYNC_COLUMNS[table])
      .contains("allowed_roles", [roleId])
      .lte("updated_at", highWatermark)
      .order("updated_at", { ascending: true })
      .order("id", { ascending: true })
      .range(from, from + SYNC_PAGE_SIZE);

    if (error) throw new Error(`${table} role-sync failed: ${error.message}`);
    if (!data?.length) break;

    const rows = data as unknown as SyncRow[];
    const tx = db.transaction(table, "readwrite");

    for (const row of rows) {
      tx.store.put(row);
      updateChangedMeta({ table, changedCategoryMeta, changedIds, row });
    }
    await tx.done;

    if (rows.length < SYNC_PAGE_SIZE) break;
    from += SYNC_PAGE_SIZE;
  }
};

export const syncTable = async ({
  supabase,
  db,
  table,
  changedIds,
  idbLastSync,
  lastSync,
  changedCategoryMeta,
}: SyncTableConfig): Promise<boolean> => {
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
    const tx = db.transaction(table, "readwrite");

    for (const row of rows) {
      tx.store.put(row);
      changedRows++;
      updateChangedMeta({ table, changedCategoryMeta, changedIds, row });
    }
    await tx.done;

    if (rows.length < SYNC_PAGE_SIZE) break;
    from += SYNC_PAGE_SIZE;
  }

  await db.put(STORE.SYNC_META, { id: table, updated_at: highWatermark });

  return (
    changedRows > 0 &&
    SEARCH_LOOKUP_TABLES.includes(
      table as (typeof SEARCH_LOOKUP_TABLES)[number],
    )
  );
};

export interface TableMeta {
  count: number;
  max_updated_at: string | null;
}

export interface FileInfo {
  name: string;
  tables: Record<string, TableMeta>;
}

export type SyncManifest = {
  files: FileInfo[];
};

export const loadStaticJsonSeeds = async (
  db: IDBPDatabase<RSP_IDB>,
  origin: string,
): Promise<boolean> => {
  const manifestRes = await fetch(`${origin}/sync/manifest.json`);
  if (!manifestRes.ok) return false;

  const manifest = (await manifestRes.json()) as SyncManifest;

  // Fetch and process all files in parallel
  await Promise.all(
    manifest.files.map(async (fileInfo: FileInfo) => {
      const fileRes = await fetch(`${origin}/sync/${fileInfo.name}`);
      if (!fileRes.ok)
        throw new Error(`Failed to fetch sync file: ${fileInfo.name}`);
      const content = await fileRes.json();

      if (content.table) {
        // Single table files (categories, chunked recordings, materials)
        const tx = db.transaction(content.table, "readwrite");
        for (const row of content.data) {
          tx.store.put(row);
        }
        await tx.done;
      } else {
        // Multi-table metadata or faqs files
        for (const table of Object.keys(content.data)) {
          const tx = db.transaction(table, "readwrite");
          for (const row of content.data[table]) {
            tx.store.put(row);
          }
          await tx.done;
        }
      }
    }),
  );

  // Write updated_at watermarks to sync_meta
  const syncMetaTx = db.transaction(STORE.SYNC_META, "readwrite");
  for (const fileInfo of manifest.files) {
    for (const [table, meta] of Object.entries(fileInfo.tables)) {
      if (meta.max_updated_at) {
        syncMetaTx.store.put({
          id: table,
          updated_at: meta.max_updated_at,
        });
      }
    }
  }
  await syncMetaTx.done;

  return true;
};
