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
import type { ClientWatermarks, SyncResponseData, SyncTable } from "@/types";
import {
  getCachedPublicTable,
  getCachedRoleExtraTable,
  getCachedUserTable,
} from "./baseline-cache";
import { getCachedLiveDiff } from "./live-diff-fetcher";
import { getCachedSyncMeta } from "./meta-service";

const resolvePublicTableDelta = async (
  table: SyncTable,
  clientWatermark: string,
): Promise<[SyncTable, unknown[]]> => {
  if (table === STORE.DELETED_RECORDS || table === STORE.RESTRICTED_RECORDS) {
    const liveDiffRows = await getCachedLiveDiff(
      table,
      clientWatermark || null,
    );
    const resultDelta = stripUpdatedAt(liveDiffRows.sort(sortByDate()));
    return [table, resultDelta];
  }

  const publicRows = await getCachedPublicTable(table);
  const highestBaselineUpdatedAt =
    (publicRows[publicRows.length - 1]?.["updated_at"] as string | undefined) ??
    null;

  const liveDiffRows = await getCachedLiveDiff(table, highestBaselineUpdatedAt);

  const pickedPublic = sliceAfterWatermark(
    publicRows,
    clientWatermark,
    highestBaselineUpdatedAt,
  );

  const pickedLive = liveDiffRows.filter(
    (r) =>
      !clientWatermark ||
      (r["updated_at"] && (r["updated_at"] as string) > clientWatermark),
  );

  const mergedMap = new Map<unknown, Record<string, unknown>>();
  for (const row of pickedPublic) {
    if (row["id"] !== undefined) mergedMap.set(row["id"], row);
  }
  for (const row of pickedLive) {
    if (row["id"] !== undefined) mergedMap.set(row["id"], row);
  }

  const resultDelta = stripUpdatedAt(
    Array.from(mergedMap.values())
      .map((r) => pickSyncColumns(r, table))
      .sort(sortByDate()),
  );
  return [table, resultDelta];
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

  const pickedRole = sliceAfterWatermark(
    roleRows,
    clientWatermark,
    highestBaselineUpdatedAt,
  );

  const pickedLive = liveDiffRows.filter(
    (r) =>
      !clientWatermark ||
      (r["updated_at"] && (r["updated_at"] as string) > clientWatermark),
  );

  const mergedMap = new Map<unknown, Record<string, unknown>>();
  for (const row of pickedRole) {
    if (row["id"] !== undefined) mergedMap.set(row["id"], row);
  }
  for (const row of pickedLive) {
    if (row["id"] !== undefined) mergedMap.set(row["id"], row);
  }

  const resultDelta = stripUpdatedAt(
    Array.from(mergedMap.values())
      .map((r) => pickSyncColumns(r, table))
      .sort(sortByDate()),
  );
  return [table, resultDelta];
};

export const computePublicSyncDelta = async (
  watermarks: ClientWatermarks,
): Promise<SyncResponseData> => {
  const serverSyncMeta = await getCachedSyncMeta();

  const dirtyTables: SyncTable[] = [];
  for (const [table, clientTime] of Object.entries(watermarks)) {
    if (!(table in SYNC_COLUMNS)) continue;
    const serverTime = serverSyncMeta[table];
    if (serverTime && serverTime > (clientTime || "")) {
      dirtyTables.push(table as SyncTable);
    }
  }

  if (dirtyTables.length === 0) {
    return {
      changed: false,
      sync_meta: serverSyncMeta,
      deltas: {},
    };
  }

  const deltaEntries = await Promise.all(
    dirtyTables.map((table) =>
      resolvePublicTableDelta(table, watermarks[table] || ""),
    ),
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

  const dirtyTables: SyncTable[] = [];
  for (const [table, clientTime] of Object.entries(watermarks)) {
    if (!(ROLE_SYNCED_TABLES as readonly string[]).includes(table)) continue;
    const serverTime = serverSyncMeta[table];
    if (serverTime && serverTime > (clientTime || "")) {
      dirtyTables.push(table as SyncTable);
    }
  }

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

      const userRows = Array.from(mergedMap.values()).filter((row) => {
        if (table === STORE.USERS) {
          return row["id"] === userId;
        }
        if (table === STORE.QUERY_REPLIES) {
          return row["query_id"] && userQueryIds.has(String(row["query_id"]));
        }
        return row["user_id"] === userId;
      });

      const resultDelta = stripUpdatedAt(
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
