import { unstable_cache } from "next/cache";
import { CACHE_TAG } from "@/app/api/constants";
import {
  ROLE_SYNCED_TABLES,
  STORE,
  SYNC_COLUMNS,
  USER_SPECIFIC_TABLES,
} from "@/constants";
import {
  isRoleTable,
  pickSyncColumns,
  sliceAfterWatermark,
  stripUpdatedAt,
} from "@/lib/sync-utils";
import { sortByDate } from "@/lib/utils";
import type {
  Category,
  ClientWatermarks,
  Redirect,
  SyncResponseData,
  SyncTable,
} from "@/types";
import {
  getCachedPublicTable,
  getCachedRoleExtraTable,
  getCachedUserTable,
  getFullPublicTable,
} from "./baseline-cache";
import { getCachedLiveDiff } from "./live-diff-fetcher";
import { getCachedSyncMeta } from "./meta-service";

const mergeAndPickTableRows = (
  baselineRows: Record<string, unknown>[],
  liveDiffRows: Record<string, unknown>[],
  clientWatermark: string,
  highestBaselineUpdatedAt: string | null,
): Record<string, unknown>[] => {
  const pickedBaseline = sliceAfterWatermark(
    baselineRows,
    clientWatermark,
    highestBaselineUpdatedAt,
  );

  const pickedLive = liveDiffRows.filter(
    (r) =>
      !clientWatermark ||
      (r["updated_at"] && (r["updated_at"] as string) > clientWatermark),
  );

  const mergedMap = new Map<unknown, Record<string, unknown>>();
  for (const row of pickedBaseline) {
    if (row["id"] !== undefined) mergedMap.set(row["id"], row);
  }
  for (const row of pickedLive) {
    if (row["id"] !== undefined) mergedMap.set(row["id"], row);
  }

  return Array.from(mergedMap.values());
};

export const resolvePublicTableDelta = async <T>(
  table: SyncTable,
  clientWatermark: string,
): Promise<T[]> => {
  if (table === STORE.DELETED_RECORDS || table === STORE.RESTRICTED_RECORDS) {
    const liveDiffRows = await getCachedLiveDiff(
      table,
      clientWatermark || null,
    );
    return stripUpdatedAt(liveDiffRows.sort(sortByDate())) as T[];
  }

  const publicRows = await getCachedPublicTable(table);
  const highestBaselineUpdatedAt =
    (publicRows[publicRows.length - 1]?.["updated_at"] as string | undefined) ??
    null;

  // If client watermark is older than the oldest row in our cached 1,000-row window, fallback to unzipped full table
  const oldestCachedUpdatedAt = publicRows[0]?.["updated_at"] as
    | string
    | undefined;
  const isClientBehindWindow = Boolean(
    clientWatermark &&
      oldestCachedUpdatedAt &&
      clientWatermark < oldestCachedUpdatedAt,
  );

  const baselineSourceRows = isClientBehindWindow
    ? await getFullPublicTable(table)
    : publicRows;

  const liveDiffRows = await getCachedLiveDiff(table, highestBaselineUpdatedAt);
  const mergedRows = mergeAndPickTableRows(
    baselineSourceRows,
    liveDiffRows,
    clientWatermark,
    highestBaselineUpdatedAt,
  );

  return stripUpdatedAt(
    mergedRows.map((r) => pickSyncColumns(r, table)).sort(sortByDate()),
  ) as T[];
};

const resolveRoleTableDelta = async (
  table: SyncTable,
  clientWatermark: string,
  roleId: number,
): Promise<[SyncTable, unknown[]]> => {
  // Only role-synced tables contain role-specific data
  if (!isRoleTable(table)) {
    return [table, []];
  }

  const roleRows = await getCachedRoleExtraTable(table, roleId);
  const highestBaselineUpdatedAt =
    (roleRows[roleRows.length - 1]?.["updated_at"] as string | undefined) ??
    null;

  const liveDiffRows = await getCachedLiveDiff(
    table,
    highestBaselineUpdatedAt,
    roleId,
  );
  const mergedRows = mergeAndPickTableRows(
    roleRows,
    liveDiffRows,
    clientWatermark,
    highestBaselineUpdatedAt,
  );

  const resultDelta = stripUpdatedAt(
    mergedRows.map((r) => pickSyncColumns(r, table)).sort(sortByDate()),
  );
  return [table, resultDelta];
};

const findDirtyTables = (
  watermarks: ClientWatermarks,
  serverSyncMeta: Record<string, string>,
  isValidTable: (table: string) => boolean,
): SyncTable[] => {
  const dirtyTables: SyncTable[] = [];
  for (const [table, clientTime] of Object.entries(watermarks)) {
    if (!isValidTable(table)) continue;
    const serverTime = serverSyncMeta[table];
    if (serverTime && serverTime > (clientTime || "")) {
      dirtyTables.push(table as SyncTable);
    }
  }
  return dirtyTables;
};

export const computePublicSyncDelta = async (
  watermarks: ClientWatermarks,
): Promise<SyncResponseData> => {
  const serverSyncMeta = await getCachedSyncMeta();
  const dirtyTables = findDirtyTables(
    watermarks,
    serverSyncMeta,
    (table) => table in SYNC_COLUMNS,
  );

  if (dirtyTables.length === 0) {
    return {
      changed: false,
      sync_meta: serverSyncMeta,
      deltas: {},
    };
  }

  const deltaEntries = await Promise.all(
    dirtyTables.map(async (table) => [
      table,
      await resolvePublicTableDelta(table, watermarks[table] || ""),
    ]),
  );

  return {
    changed: true,
    sync_meta: serverSyncMeta,
    deltas: Object.fromEntries(deltaEntries),
  };
};

export const computeRoleSyncDelta = async (
  watermarks: ClientWatermarks,
  roleId: number,
): Promise<SyncResponseData> => {
  const serverSyncMeta = await getCachedSyncMeta();
  const dirtyTables = findDirtyTables(watermarks, serverSyncMeta, (table) =>
    (ROLE_SYNCED_TABLES as readonly string[]).includes(table),
  );

  if (dirtyTables.length === 0) {
    return {
      changed: false,
      sync_meta: serverSyncMeta,
      deltas: {},
    };
  }

  const deltaEntries = await Promise.all(
    dirtyTables.map((table) =>
      resolveRoleTableDelta(table, watermarks[table] || "", roleId),
    ),
  );

  return {
    changed: true,
    sync_meta: serverSyncMeta,
    deltas: Object.fromEntries(deltaEntries),
  };
};

export const computeUserSyncDelta = async (
  watermarks: ClientWatermarks,
  userId: string,
): Promise<SyncResponseData> => {
  const serverSyncMeta = await getCachedSyncMeta();

  // Load all user queries first so we know all user query IDs across baseline & live diff
  const baselineQueries = await getCachedUserTable(STORE.USER_QUERIES);
  const highestQueriesBaseline =
    (baselineQueries[baselineQueries.length - 1]?.["updated_at"] as
      | string
      | undefined) ?? null;
  const liveQueries = await getCachedLiveDiff(
    STORE.USER_QUERIES,
    highestQueriesBaseline,
  );

  const userQueryIds = new Set<string>();
  for (const q of baselineQueries) {
    if (q["user_id"] === userId && q["id"]) {
      userQueryIds.add(String(q["id"]));
    }
  }
  for (const q of liveQueries) {
    if (q["user_id"] === userId && q["id"]) {
      userQueryIds.add(String(q["id"]));
    }
  }

  const deltaEntries = await Promise.all(
    (USER_SPECIFIC_TABLES as readonly SyncTable[]).map(async (table) => {
      const clientWatermark = watermarks[table] || "";
      const baselineRows = await getCachedUserTable(table);
      const highestBaselineUpdatedAt =
        (baselineRows[baselineRows.length - 1]?.["updated_at"] as
          | string
          | undefined) ?? null;

      const liveDiffRows = await getCachedLiveDiff(
        table,
        highestBaselineUpdatedAt,
      );

      const mergedRows = mergeAndPickTableRows(
        baselineRows,
        liveDiffRows,
        clientWatermark,
        highestBaselineUpdatedAt,
      );

      const userRows = mergedRows.filter((row) => {
        if (table === STORE.USERS) {
          return row["id"] === userId;
        }
        if (table === STORE.QUERY_REPLIES) {
          return row["query_id"] && userQueryIds.has(String(row["query_id"]));
        }
        return row["user_id"] === userId;
      });

      const resultDelta =
        table === STORE.QUERY_REPLIES
          ? userRows.map((r) => pickSyncColumns(r, table)).sort(sortByDate())
          : stripUpdatedAt(
              userRows.map((r) => pickSyncColumns(r, table)).sort(sortByDate()),
            );
      return [table, resultDelta] as [SyncTable, unknown[]];
    }),
  );

  const deltas = Object.fromEntries(
    deltaEntries.filter(([_, rows]) => rows.length > 0),
  );
  const changed = Object.keys(deltas).length > 0;

  return {
    changed,
    sync_meta: serverSyncMeta,
    deltas,
  };
};

export const getCachedPublicUrlPaths = unstable_cache(
  async (): Promise<string[]> => {
    const [categories, redirects] = await Promise.all([
      resolvePublicTableDelta<Category>(STORE.CATEGORIES, ""),
      resolvePublicTableDelta<Redirect>(STORE.REDIRECTS, ""),
    ]);

    return [
      ...categories.map((c) => c.url_path),
      ...redirects.map((r) => r.id),
    ].filter(Boolean);
  },
  ["public-url-paths"],
  {
    revalidate: 300,
    tags: [CACHE_TAG.SYNC_META, CACHE_TAG.LIVE_DIFF],
  },
);
