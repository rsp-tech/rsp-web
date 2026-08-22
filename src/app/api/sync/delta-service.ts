import { STORE, SYNC_COLUMNS } from "@/constants";
import {
  isRoleTable,
  sliceAfterWatermark,
  stripUpdatedAt,
} from "@/lib/sync-utils";
import { sortByDate } from "@/lib/utils";
import type { SyncRequestBody, SyncResponseData, SyncTable } from "@/types";
import {
  getCachedPublicTable,
  getCachedRoleExtraTable,
} from "./baseline-cache";
import { getCachedLiveDiff } from "./live-diff-fetcher";
import { getCachedSyncMeta } from "./meta-service";

const resolveTableDelta = async (
  table: SyncTable,
  clientWatermark: string,
  roleId?: number,
): Promise<[SyncTable, unknown[]]> => {
  // Special case: deleted_records is not in baseline zips; fetch live diff directly
  if (table === STORE.DELETED_RECORDS) {
    const liveDiffRows = await getCachedLiveDiff(
      table,
      clientWatermark || null,
      roleId,
    );
    const resultDelta = stripUpdatedAt(liveDiffRows.sort(sortByDate()));
    return [table, resultDelta];
  }

  // 1. Fetch pre-sorted public and role-extra baseline tables in parallel
  const [publicRows, roleRows] = await Promise.all([
    getCachedPublicTable(table),
    roleId && isRoleTable(table)
      ? getCachedRoleExtraTable(table, roleId)
      : Promise.resolve([]),
  ]);

  // 2. Determine highest baseline watermark from the sorted lists
  const lastPublicTime = publicRows[publicRows.length - 1]?.["updated_at"] as
    | string
    | undefined;
  const lastRoleTime = roleRows[roleRows.length - 1]?.["updated_at"] as
    | string
    | undefined;

  const highestBaselineUpdatedAt =
    [lastPublicTime, lastRoleTime].filter(Boolean).sort().pop() ?? null;

  // 3. Fetch recent Supabase live diff since the baseline watermark
  const liveDiffRows = await getCachedLiveDiff(
    table,
    highestBaselineUpdatedAt,
    roleId,
  );

  // 4. Pick changed rows from public and role baselines using O(log N) binary search slice
  const pickedPublic = sliceAfterWatermark(
    publicRows,
    clientWatermark,
    highestBaselineUpdatedAt,
  );
  const pickedRole = sliceAfterWatermark(
    roleRows,
    clientWatermark,
    highestBaselineUpdatedAt,
  );

  // 5. Pick changed rows from live diff
  const pickedLive = liveDiffRows.filter(
    (r) =>
      !clientWatermark ||
      (r["updated_at"] && (r["updated_at"] as string) > clientWatermark),
  );

  // 6. Merge only the picked rows (live overwrites baseline on conflict)
  const mergedMap = new Map<unknown, Record<string, unknown>>();

  for (const row of pickedPublic) {
    if (row["id"] !== undefined) mergedMap.set(row["id"], row);
  }

  for (const row of pickedRole) {
    if (row["id"] !== undefined) mergedMap.set(row["id"], row);
  }

  for (const row of pickedLive) {
    if (row["id"] !== undefined) mergedMap.set(row["id"], row);
  }

  // 7. Sort by updated_at and strip updated_at before returning
  const resultDelta = stripUpdatedAt(
    Array.from(mergedMap.values()).sort(sortByDate()),
  );
  return [table, resultDelta];
};

export const computeSyncDelta = async (
  body: SyncRequestBody,
): Promise<SyncResponseData> => {
  const { roleId, watermarks } = body;
  const serverSyncMeta = await getCachedSyncMeta();

  // Identify dirty tables requested by the client
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
      resolveTableDelta(table, watermarks[table] || "", roleId),
    ),
  );

  return {
    changed: true,
    sync_meta: serverSyncMeta,
    deltas: Object.fromEntries(deltaEntries),
  };
};
