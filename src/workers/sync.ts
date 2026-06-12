import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { IDBPDatabase } from "idb";
import {
  META_KEY,
  STORE,
  SUPABASE_SCHEMA,
  SYNC_CONCURRENCY,
  SYNC_PAGE_SIZE,
  WORKER_MSG,
} from "@/constants";
import type { Json } from "@/database.types";
import type { RSPDatabase } from "@/lib/idb";
import { getDB } from "@/lib/idb";
import { createLimiter, errorMessage } from "@/lib/utils";
import type { SearchableTable, SyncChangedIds, SyncResult } from "@/types";

type SyncTable = keyof Omit<RSPDatabase, "metadata">;
type SyncRow = RSPDatabase[SyncTable]["value"] & {
  created_at?: string | null;
  id: number | string;
  metadata?: Json | null;
  updated_at: string | null;
  url_path?: string;
};

type SyncCursor = {
  id: number | string;
  updatedAt: string;
};

type WorkerMessage = {
  type: typeof WORKER_MSG.START_SYNC;
  supabaseUrl: string;
  supabaseKey: string;
  accessToken: string;
};

const ALL_TABLES: SyncTable[] = [
  STORE.RECORDINGS,
  STORE.CATEGORIES,
  STORE.MATERIALS,
  STORE.SPEAKERS,
  STORE.SERVICES,
  STORE.LANGUAGES,
  STORE.REDIRECTS,
  STORE.CONTENT_TYPES,
  STORE.VENUES,
  STORE.EVENTS,
  STORE.FAQ_CATEGORIES,
  STORE.FAQS,
  STORE.FEATURED_SECTIONS,
  STORE.FEATURED_ITEMS,
];

const SEARCH_LOOKUP_TABLES = new Set<SyncTable>([STORE.SPEAKERS, STORE.VENUES]);

const isSearchableTable = (table: SyncTable): table is SearchableTable =>
  table === STORE.RECORDINGS ||
  table === STORE.CATEGORIES ||
  table === STORE.MATERIALS;

const stripCacheMetadata = <T extends SyncRow>(
  item: T,
): Omit<T, "created_at" | "metadata"> => {
  const { created_at: _createdAt, metadata: _metadata, ...cacheRow } = item;
  return cacheRow;
};

const getLastSync = async (
  db: IDBPDatabase<RSPDatabase>,
  table: SyncTable,
): Promise<string | undefined> => {
  const value = await db.get(
    STORE.METADATA,
    `${META_KEY.LAST_SYNC_PREFIX}${table}`,
  );

  return typeof value === "string" ? value : undefined;
};

const fetchTableWatermark = async (
  supabase: SupabaseClient,
  table: SyncTable,
): Promise<string | null> => {
  const { data, error } = await supabase
    .schema(SUPABASE_SCHEMA)
    .from(table)
    .select("updated_at")
    .not("updated_at", "is", null)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) throw new Error(`${table}: ${error.message}`);

  const updatedAt = data?.[0]?.updated_at;
  return typeof updatedAt === "string" ? updatedAt : null;
};

const fetchChangedPage = async (
  supabase: SupabaseClient,
  table: SyncTable,
  highWatermark: string,
  since?: string,
  cursor?: SyncCursor,
) => {
  let query = supabase
    .schema(SUPABASE_SCHEMA)
    .from(table)
    .select("*")
    .not("updated_at", "is", null)
    .lte("updated_at", highWatermark)
    .order("updated_at", { ascending: true })
    .order("id", { ascending: true })
    .limit(SYNC_PAGE_SIZE);

  if (since) {
    query = query.gt("updated_at", since);
  }

  if (cursor) {
    query = query.or(
      `updated_at.gt.${cursor.updatedAt},and(updated_at.eq.${cursor.updatedAt},id.gt.${cursor.id})`,
    );
  }

  return query;
};

const appendChangedId = (
  changedIds: SyncChangedIds,
  table: SyncTable,
  id: number | string,
) => {
  if (!isSearchableTable(table) || typeof id !== "number") return;

  changedIds[table] ??= [];
  changedIds[table].push(id);
};

const toSyncResult = (
  changedCategoryPaths: Set<string>,
  changedIds: SyncChangedIds,
  rebuildSearchIndex: boolean,
): SyncResult => ({
  changedCategoryPaths: [...changedCategoryPaths],
  changedIds: {
    recordings: [...new Set(changedIds.recordings ?? [])],
    categories: [...new Set(changedIds.categories ?? [])],
    materials: [...new Set(changedIds.materials ?? [])],
  },
  rebuildSearchIndex,
});

const syncTable = async (
  supabase: SupabaseClient,
  db: IDBPDatabase<RSPDatabase>,
  table: SyncTable,
  changedCategoryPaths: Set<string>,
  changedIds: SyncChangedIds,
): Promise<boolean> => {
  const localLastSync = await getLastSync(db, table);
  const highWatermark = await fetchTableWatermark(supabase, table);

  if (!highWatermark) return false;

  if (
    localLastSync &&
    new Date(localLastSync).getTime() >= new Date(highWatermark).getTime()
  ) {
    return false;
  }

  let cursor: SyncCursor | undefined;
  let changedRows = 0;

  while (true) {
    const { data, error } = await fetchChangedPage(
      supabase,
      table,
      highWatermark,
      localLastSync,
      cursor,
    );

    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;

    const rows = data as SyncRow[];
    const tx = db.transaction(table, "readwrite");

    for (const row of rows) {
      tx.store.put(stripCacheMetadata(row));
    }

    await tx.done;

    for (const row of rows) {
      changedRows++;
      appendChangedId(changedIds, table, row.id);

      if (table === STORE.CATEGORIES && row.url_path) {
        changedCategoryPaths.add(row.url_path);
      }
    }

    const lastRow = rows[rows.length - 1];
    if (!lastRow.updated_at) {
      throw new Error(`${table}: received row without updated_at`);
    }

    cursor = { id: lastRow.id, updatedAt: lastRow.updated_at };
    postMessage({ type: WORKER_MSG.PROGRESS, message: `Syncing ${table}...` });

    if (rows.length < SYNC_PAGE_SIZE) break;
  }

  await db.put(
    STORE.METADATA,
    highWatermark,
    `${META_KEY.LAST_SYNC_PREFIX}${table}`,
  );

  if (table === STORE.CATEGORIES) {
    await db.put(
      STORE.METADATA,
      highWatermark,
      META_KEY.CATEGORIES_LAST_UPDATED,
    );
  }

  return changedRows > 0 && SEARCH_LOOKUP_TABLES.has(table);
};

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, supabaseUrl, supabaseKey, accessToken } = event.data;
  if (type !== WORKER_MSG.START_SYNC) return;

  try {
    const db = await getDB();
    if (!db) {
      postMessage({
        type: WORKER_MSG.ERROR,
        message: "IndexedDB not available",
      });
      return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: accessToken
        ? { headers: { Authorization: `Bearer ${accessToken}` } }
        : undefined,
    });

    postMessage({ type: WORKER_MSG.PROGRESS, message: "Syncing..." });

    const limit = createLimiter(SYNC_CONCURRENCY);
    const changedCategoryPaths = new Set<string>();
    const changedIds: SyncChangedIds = {};

    const lookupTableChanges = await Promise.all(
      ALL_TABLES.map((table) =>
        limit(() =>
          syncTable(supabase, db, table, changedCategoryPaths, changedIds),
        ),
      ),
    );

    postMessage({
      type: WORKER_MSG.SUCCESS,
      ...toSyncResult(
        changedCategoryPaths,
        changedIds,
        lookupTableChanges.some(Boolean),
      ),
    });
  } catch (err) {
    postMessage({
      type: WORKER_MSG.ERROR,
      message: errorMessage(err),
    });
  }
};
