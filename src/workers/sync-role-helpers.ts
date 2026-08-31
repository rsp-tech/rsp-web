import type { IDBPDatabase } from "idb";
import { META_KEY, ROLE_SYNCED_TABLES, STORE } from "@/constants";
import type { RSP_IDB } from "@/lib/idb";
import { toUpdatedAtMap } from "@/lib/sync-utils";
import type { SyncResult, SyncTable } from "@/types";
import { performRoleCleanup } from "./cleanup-helpers";
import { fetchSyncMeta } from "./meta-cache";
import {
  applyDeltas,
  createInitialSyncState,
  fetchRoleSyncDeltas,
  isDatabaseStale,
  loadStaticZipSeedsForRole,
  toSyncResult,
} from "./utils";

export const syncRoleData = async (
  db: IDBPDatabase<RSP_IDB>,
  origin: string,
  data: {
    roleId: number;
    userId: string;
    accessToken: string;
  },
  progressCallback?: (msg: string) => void,
): Promise<SyncResult> => {
  const { roleId, accessToken } = data;

  // Phase 1: Role Cleanup (purges old role data if roleId shifted)
  const { clearedRole } = await performRoleCleanup(db, roleId);

  const { changedCategoryMeta, changedIds, newAdditions } =
    createInitialSyncState();

  let seedLoaded = false;

  const storedRole = await db.get(STORE.ROLE_META, META_KEY.SYNC_ROLE);

  const { serverMeta } = await fetchSyncMeta(origin);
  const isStale = await isDatabaseStale(db, serverMeta);

  // Phase 2: Role Base Seed (if role changed or DB is stale)
  if (!storedRole || storedRole !== roleId || isStale) {
    try {
      progressCallback?.("उत्कर्षयति… · Optimizing…");
      const loaded = await loadStaticZipSeedsForRole(
        db,
        origin,
        roleId,
        accessToken,
      );
      if (loaded) {
        await db.put(STORE.ROLE_META, roleId, META_KEY.SYNC_ROLE);
        seedLoaded = true;
      }
    } catch (zipErr) {
      console.error(
        "Static role sync ZIP seed failed, falling back to delta sync:",
        zipErr,
      );
    }
  }

  // Phase 3: Role Delta Sync
  let changedTables: string[] = seedLoaded
    ? ([...ROLE_SYNCED_TABLES] as string[])
    : [];

  if (accessToken && roleId > 0) {
    const idbRoleSyncMeta = toUpdatedAtMap(
      await db.getAll(STORE.ROLE_SYNC_META),
    );

    const hasDirtyTables = (ROLE_SYNCED_TABLES as readonly string[]).some(
      (table) => {
        const serverTime = serverMeta[table];
        return serverTime && serverTime > (idbRoleSyncMeta[table] || "");
      },
    );

    if (hasDirtyTables) {
      const watermarks: Record<string, string> = Object.fromEntries(
        (ROLE_SYNCED_TABLES as readonly SyncTable[]).map((t) => [
          t,
          idbRoleSyncMeta[t] || "",
        ]),
      );

      const roleDeltaResult = await fetchRoleSyncDeltas(
        origin,
        watermarks,
        accessToken,
      );

      if (
        roleDeltaResult?.deltas &&
        Object.keys(roleDeltaResult.deltas).length > 0
      ) {
        const deltaChangedTables = await applyDeltas(
          db,
          roleDeltaResult.deltas,
          roleDeltaResult.sync_meta || {},
          idbRoleSyncMeta,
          changedIds,
          changedCategoryMeta,
          newAdditions,
          STORE.ROLE_SYNC_META,
        );
        changedTables = Array.from(
          new Set([...changedTables, ...deltaChangedTables]),
        );
      }
    }
  }

  return toSyncResult(
    db,
    changedCategoryMeta,
    changedIds,
    changedTables,
    newAdditions,
    false,
    clearedRole,
    seedLoaded,
  );
};
