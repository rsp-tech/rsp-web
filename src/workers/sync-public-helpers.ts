import type { IDBPDatabase } from "idb";
import { GENERIC_TABLES, META_KEY, STORE } from "@/constants";
import type { RSP_IDB } from "@/lib/idb";
import { toUpdatedAtMap } from "@/lib/sync-utils";
import type { SyncResult } from "@/types";
import { fetchSyncMeta } from "./meta-cache";
import {
  applyDeltas,
  createInitialSyncState,
  fetchPublicSyncDeltas,
  isDatabaseStale,
  loadStaticZipSeeds,
  toSyncResult,
} from "./utils";

export const syncPublicData = async (
  db: IDBPDatabase<RSP_IDB>,
  origin: string,
  progressCallback?: (msg: string) => void,
): Promise<SyncResult> => {
  const { changedCategoryMeta, changedIds, newAdditions } =
    createInitialSyncState();

  let seedLoaded = false;

  // 1. Fetch server sync metadata (deduped & cached across workers)
  const { serverMeta, publicFeatureFlags } = await fetchSyncMeta(origin);

  // 2. If database is stale compared to server state, load public base seed
  if (await isDatabaseStale(db, serverMeta)) {
    try {
      progressCallback?.("उत्कर्षयति… · Optimizing…");
      const loaded = await loadStaticZipSeeds(db, origin);
      if (loaded) {
        seedLoaded = true;
      }
    } catch (zipErr) {
      console.error(
        "[Sync Worker] Static sync ZIP seed failed, falling back to dynamic sync:",
        zipErr,
      );
    }
  }

  // 3. Immediately proceed to delta sync using current IDB watermarks (post-seed if seeded)
  const idbSyncMeta = toUpdatedAtMap(await db.getAll(STORE.SYNC_META));

  let changedTables: string[] = seedLoaded
    ? (GENERIC_TABLES as readonly string[]).slice()
    : [];

  // Ensure public feature flags are always overwritten from server
  if (Array.isArray(publicFeatureFlags)) {
    await db.put(
      STORE.ROLE_META,
      JSON.stringify(publicFeatureFlags),
      META_KEY.PUBLIC_FEATURES,
    );
  }

  const dirtyTables = GENERIC_TABLES.filter((table) => {
    const serverTime = serverMeta[table];
    return serverTime && serverTime > (idbSyncMeta[table] || "");
  });

  if (dirtyTables.length > 0) {
    const watermarks: Record<string, string> = Object.fromEntries(
      dirtyTables.map((t) => [t, `${idbSyncMeta[t]}::${serverMeta[t]}`]),
    );

    const publicDeltaResult = await fetchPublicSyncDeltas(origin, watermarks);

    if (publicDeltaResult) {
      const deltaChangedTables = await applyDeltas(
        db,
        publicDeltaResult.deltas || {},
        publicDeltaResult.sync_meta || {},
        idbSyncMeta,
        changedIds,
        changedCategoryMeta,
        newAdditions,
      );
      changedTables = Array.from(
        new Set([...changedTables, ...deltaChangedTables]),
      );
    }
  } else if (serverMeta && Object.keys(serverMeta).length > 0) {
    const metaTx = db.transaction(STORE.SYNC_META, "readwrite");
    for (const [table, updated_at] of Object.entries(serverMeta)) {
      if (updated_at) {
        metaTx.store.put({ id: table, updated_at });
      }
    }
    await metaTx.done;
  }

  return toSyncResult(
    db,
    changedCategoryMeta,
    changedIds,
    changedTables,
    newAdditions,
    false,
    false,
    seedLoaded,
  );
};
