import type { IDBPDatabase } from "idb";
import {
  FEATURE_FLAGS_TABLE,
  META_KEY,
  STORE,
  USER_SPECIFIC_TABLES,
} from "@/constants";
import type { RSP_IDB } from "@/lib/idb";
import { toUpdatedAtMap } from "@/lib/sync-utils";
import type { SyncResult, SyncTable } from "@/types";
import { performUserCleanup } from "./cleanup-helpers";
import { fetchSyncMeta } from "./meta-cache";
import {
  applyDeltas,
  createInitialSyncState,
  fetchUserSyncDeltas,
  loadUserSeeds,
  toSyncResult,
} from "./utils";

export const syncUserData = async (
  db: IDBPDatabase<RSP_IDB>,
  origin: string,
  data: {
    userId: string;
    accessToken: string;
  },
  progressCallback?: (msg: string) => void,
): Promise<SyncResult> => {
  const { userId, accessToken } = data;

  // Phase 1: Local User Cleanup (clears previous user data on account switch)
  const { clearedUser } = await performUserCleanup(db, userId);

  const { changedCategoryMeta, changedIds, newAdditions } =
    createInitialSyncState();

  let changedTables: string[] = [];

  if (accessToken && userId) {
    // Phase 2: Seed user tables if not yet seeded or user changed
    const userMeta = await db.get(STORE.SYNC_META, STORE.USERS);
    if (clearedUser || !userMeta?.updated_at) {
      try {
        progressCallback?.("उत्कर्षयति… · Initializing user data…");
        await loadUserSeeds(db, origin, accessToken);
      } catch (seedErr) {
        console.error("Failed to load user seed data:", seedErr);
      }
    }

    // Phase 3: Fetch deltas for USER_SPECIFIC_TABLES if dirty
    progressCallback?.("परिष्करोति… · Syncing user data…");
    const { serverMeta } = await fetchSyncMeta(origin);
    const idbSyncMeta = toUpdatedAtMap(await db.getAll(STORE.SYNC_META));

    const hasDirtyTables = [...USER_SPECIFIC_TABLES, FEATURE_FLAGS_TABLE].some(
      (table) => {
        const serverTime = serverMeta[table];
        return serverTime && serverTime > (idbSyncMeta[table] || "");
      },
    );

    if (hasDirtyTables) {
      const watermarks: Record<string, string> = Object.fromEntries(
        (USER_SPECIFIC_TABLES as readonly SyncTable[]).map((t) => [
          t,
          idbSyncMeta[t] || "",
        ]),
      );

      const userDeltaResult = await fetchUserSyncDeltas(
        origin,
        watermarks,
        accessToken,
      );

      if (
        userDeltaResult?.deltas &&
        Object.keys(userDeltaResult.deltas).length > 0
      ) {
        changedTables = await applyDeltas(
          db,
          userDeltaResult.deltas,
          userDeltaResult.sync_meta || {},
          idbSyncMeta,
          changedIds,
          changedCategoryMeta,
          newAdditions,
          STORE.SYNC_META,
        );
      }

      if (Array.isArray(userDeltaResult?.user_feature_flags)) {
        await db.put(
          STORE.ROLE_META,
          JSON.stringify(userDeltaResult.user_feature_flags),
          META_KEY.USER_FEATURES,
        );
      }
    } else if (serverMeta && Object.keys(serverMeta).length > 0) {
      const metaTx = db.transaction(STORE.SYNC_META, "readwrite");
      for (const table of USER_SPECIFIC_TABLES) {
        const serverTime = serverMeta[table];
        if (serverTime && typeof serverTime === "string") {
          metaTx.store.put({ id: table, updated_at: serverTime });
        }
      }
      await metaTx.done;
    }
  }

  return toSyncResult(
    db,
    changedCategoryMeta,
    changedIds,
    changedTables,
    newAdditions,
    clearedUser,
  );
};
