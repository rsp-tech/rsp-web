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
  roleId?: number;
  isPublic?: boolean;
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
const ROLE_SYNCED_TABLES: SyncTable[] = [
  STORE.CATEGORIES,
  STORE.RECORDINGS,
  STORE.MATERIALS,
];

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

  if (error) {
    throw new Error(`${table} watermark tracking failed: ${error.message}`);
  }
  return typeof data?.[0]?.updated_at === "string" ? data[0].updated_at : null;
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
  changedCategoryPaths: Array.from(changedCategoryPaths),
  changedIds: {
    recordings: Array.from(new Set(changedIds.recordings ?? [])),
    categories: Array.from(new Set(changedIds.categories ?? [])),
    materials: Array.from(new Set(changedIds.materials ?? [])),
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
    let query = supabase
      .schema(SUPABASE_SCHEMA)
      .from(table)
      .select("*")
      .not("updated_at", "is", null)
      .lte("updated_at", highWatermark)
      .order("updated_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(SYNC_PAGE_SIZE);

    if (localLastSync) query = query.gt("updated_at", localLastSync);
    if (cursor) {
      query = query.or(
        `updated_at.gt.${cursor.updatedAt},and(updated_at.eq.${cursor.updatedAt},id.gt.${cursor.id})`,
      );
    }

    const { data, error } = await query;
    if (error) throw new Error(`${table} page fetch failed: ${error.message}`);
    if (!data?.length) break;

    const rows = data as SyncRow[];
    const tx = db.transaction(table, "readwrite");

    for (const row of rows) {
      tx.store.put(stripCacheMetadata(row));
      changedRows++;
      appendChangedId(changedIds, table, row.id);

      if (table === STORE.CATEGORIES && row.url_path) {
        changedCategoryPaths.add(row.url_path);
      }
    }
    await tx.done;

    const lastRow = rows[rows.length - 1];
    if (!lastRow.updated_at)
      throw new Error(`${table}: missing field updated_at`);

    cursor = { id: lastRow.id, updatedAt: lastRow.updated_at };
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

  postMessage({
    type: WORKER_MSG.PROGRESS,
    message: `Completed sync: ${table}`,
  });
  return changedRows > 0 && SEARCH_LOOKUP_TABLES.has(table);
};

const syncTableForRole = async (
  supabase: SupabaseClient,
  db: IDBPDatabase<RSPDatabase>,
  table: SyncTable,
  roleId: number,
  changedCategoryPaths: Set<string>,
  changedIds: SyncChangedIds,
): Promise<void> => {
  const highWatermark = await fetchTableWatermark(supabase, table);
  if (!highWatermark) return;

  let cursor: SyncCursor | undefined;

  while (true) {
    let query = supabase
      .schema(SUPABASE_SCHEMA)
      .from(table)
      .select("*")
      .contains("allowed_roles", [roleId])
      .lte("updated_at", highWatermark)
      .order("updated_at", { ascending: true })
      .order("id", { ascending: true })
      .limit(SYNC_PAGE_SIZE);

    if (cursor) {
      query = query.or(
        `updated_at.gt.${cursor.updatedAt},and(updated_at.eq.${cursor.updatedAt},id.gt.${cursor.id})`,
      );
    }

    const { data, error } = await query;
    if (error) throw new Error(`${table} role-sync failed: ${error.message}`);
    if (!data?.length) break;

    const rows = data as SyncRow[];
    const tx = db.transaction(table, "readwrite");

    for (const row of rows) {
      tx.store.put(stripCacheMetadata(row));
      appendChangedId(changedIds, table, row.id);
      if (table === STORE.CATEGORIES && row.url_path) {
        changedCategoryPaths.add(row.url_path);
      }
    }
    await tx.done;

    const lastRow = rows[rows.length - 1];
    if (!lastRow.updated_at)
      throw new Error(`${table}: missing field updated_at`);
    cursor = { id: lastRow.id, updatedAt: lastRow.updated_at };

    if (rows.length < SYNC_PAGE_SIZE) break;
  }
  postMessage({
    type: WORKER_MSG.PROGRESS,
    message: `Completed role sync: ${table}`,
  });
};

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, supabaseUrl, supabaseKey, accessToken, roleId, isPublic } =
    event.data;
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

    postMessage({
      type: WORKER_MSG.PROGRESS,
      message: "Sync execution started",
    });

    const limit = createLimiter(SYNC_CONCURRENCY);
    const changedCategoryPaths = new Set<string>();
    const changedIds: SyncChangedIds = {};

    const nextRole = roleId ?? null;
    const hasStoredRole =
      (await db.getKey(STORE.METADATA, META_KEY.SYNC_ROLE)) !== undefined;
    const storedRole = await db.get(STORE.METADATA, META_KEY.SYNC_ROLE);

    if (!hasStoredRole) {
      await db.put(STORE.METADATA, nextRole, META_KEY.SYNC_ROLE);
    }

    if (
      (!hasStoredRole || storedRole !== nextRole) &&
      !isPublic &&
      roleId !== undefined
    ) {
      await Promise.all(
        ROLE_SYNCED_TABLES.map((table) =>
          limit(() =>
            syncTableForRole(
              supabase,
              db,
              table,
              roleId,
              changedCategoryPaths,
              changedIds,
            ),
          ),
        ),
      );
      await db.put(STORE.METADATA, nextRole, META_KEY.SYNC_ROLE);
    }

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
    postMessage({ type: WORKER_MSG.ERROR, message: errorMessage(err) });
  }
};
