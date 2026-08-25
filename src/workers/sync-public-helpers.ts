import type { IDBPDatabase } from "idb";
import { GENERIC_TABLES, STORE } from "@/constants";
import type { RSP_IDB } from "@/lib/idb";
import { toUpdatedAtMap } from "@/lib/sync-utils";
import type { SyncChangedIds, SyncNewAdditions, SyncResult } from "@/types";
import {
  applyDeltas,
  type ChangedCategoryMeta,
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
  const changedCategoryMeta: ChangedCategoryMeta = {
    changedCategories: {},
    changedRecordings: {},
    bubbledChangeCategoryIds: new Set(),
    bubbledChangeRecordingIds: new Set(),
  };
  const changedIds: SyncChangedIds = {
    categories: [],
    recordings: [],
    materials: [],
  };
  const newAdditions: SyncNewAdditions = {
    recordings: [],
    materials: [],
    categories: [],
    replies: [],
    requests: [],
  };

  let seedLoaded = false;

  // 1. If database is stale/fresh, load public base seed
  if (await isDatabaseStale(db)) {
    try {
      progressCallback?.("उत्कर्षयति… · Optimizing…");
      const loaded = await loadStaticZipSeeds(db, origin);
      if (loaded) {
        seedLoaded = true;
      }
    } catch (zipErr) {
      console.error(
        "Static sync ZIP seed failed, falling back to dynamic sync:",
        zipErr,
      );
    }
  }

  const idbSyncMeta = toUpdatedAtMap(await db.getAll(STORE.SYNC_META));

  let changedTables: string[] = seedLoaded
    ? (GENERIC_TABLES as readonly string[]).slice()
    : [];
  const metaRes = await fetch(`${origin}/api/sync/meta`);

  if (!metaRes.ok) throw new Error("Failed to fetch sync meta");

  const serverMeta = (await metaRes.json()) as Record<string, string>;

  const hasDirtyTables = GENERIC_TABLES.some((table) => {
    const serverTime = serverMeta[table];
    return serverTime && serverTime > (idbSyncMeta[table] || "");
  });

  if (hasDirtyTables) {
    const watermarks: Record<string, string> = Object.fromEntries(
      GENERIC_TABLES.map((t) => [t, idbSyncMeta[t] || ""]),
    );

    const publicDeltaResult = await fetchPublicSyncDeltas(origin, watermarks);

    if (
      publicDeltaResult?.deltas &&
      Object.keys(publicDeltaResult.deltas).length > 0
    ) {
      const deltaChangedTables = await applyDeltas(
        db,
        publicDeltaResult.deltas,
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
