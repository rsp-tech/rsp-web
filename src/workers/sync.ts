import type { IDBPDatabase } from "idb";
import {
  INVALIDATE_ALL_THRESHOLD,
  META_KEY,
  ROLE_SYNCED_TABLES,
  STORE,
  SYNC_CONCURRENCY,
  WORKER_MSG,
} from "@/constants";
import { getDB, type RSP_IDB } from "@/lib/idb";
import { getSupabaseClient } from "@/lib/supabase-browser";
import { createLimiter, errorMessage } from "@/lib/utils";
import type { SyncChangedIds, SyncResult } from "@/types";
import {
  type ChangedCategoryMeta,
  getTablesToSync,
  loadStaticJsonSeeds,
  syncTable,
  syncTableForRole,
} from "./utils";

type WorkerMessage = {
  type: typeof WORKER_MSG.START_SYNC;
  supabaseUrl: string;
  supabaseKey: string;
  accessToken: string;
  roleId?: number;
  isPublic?: boolean;
};

const toSyncResult = async (
  db: IDBPDatabase<RSP_IDB>,
  changedCategoryMeta: ChangedCategoryMeta,
  changedIds: SyncChangedIds,
  rebuildSearchIndex: boolean,
): Promise<SyncResult> => {
  const {
    changedCategories,
    changedRecordings,
    bubbledChangeCategoryIds,
    bubbledChangeRecordingIds,
  } = changedCategoryMeta;

  Object.keys(changedCategories).forEach((id) => {
    bubbledChangeCategoryIds.add(Number(id));
  });

  if (bubbledChangeCategoryIds.size <= INVALIDATE_ALL_THRESHOLD) {
    (
      await Promise.all(
        Array.from(bubbledChangeRecordingIds).map(
          async (id) =>
            changedRecordings[id] ??
            (
              await db.get(STORE.RECORDINGS, String(id))
            ).category_id,
        ),
      )
    ).forEach((id) => {
      bubbledChangeCategoryIds.add(id);
    });
  }

  const changedCategoryPaths =
    bubbledChangeCategoryIds.size > INVALIDATE_ALL_THRESHOLD
      ? ["*"]
      : await Promise.all(
          Array.from(bubbledChangeCategoryIds).map(async (id) =>
            id
              ? (changedCategories[id] ??
                (await db.get(STORE.CATEGORIES, id))?.url_path)
              : "~",
          ),
        );

  return {
    changedCategoryPaths,
    changedIds: {
      recordings: Array.from(new Set(changedIds.recordings ?? [])),
      categories: Array.from(new Set(changedIds.categories ?? [])),
      materials: Array.from(new Set(changedIds.materials ?? [])),
    },
    rebuildSearchIndex,
  };
};

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, accessToken, roleId, isPublic } = event.data;
  if (type !== WORKER_MSG.START_SYNC) return;

  try {
    const db = await getDB();
    if (!db) throw new Error("Sync failed: IndexedDB not available");

    const supabase = getSupabaseClient(accessToken);

    postMessage({
      type: WORKER_MSG.PROGRESS,
      message: "Syncing...",
    });

    // Optimize first-time sync by loading pre-compiled static JSON seeds
    const idbSyncMetaCount = await db.count(STORE.SYNC_META);
    if (idbSyncMetaCount === 0) {
      try {
        postMessage({
          type: WORKER_MSG.PROGRESS,
          message: "Downloading static database seed...",
        });

        const loaded = await loadStaticJsonSeeds(db, self.location.origin);
        if (loaded) {
          postMessage({
            type: WORKER_MSG.PROGRESS,
            message: "Static database seed loaded successfully.",
          });
        }
      } catch (jsonErr) {
        // Fallback silently to normal Supabase sync if static files fail
        console.error(
          "Static sync JSON seed failed, falling back to dynamic Supabase sync:",
          jsonErr,
        );
      }
    }

    const tablesToSync = await getTablesToSync(db, supabase);

    const limit = createLimiter(SYNC_CONCURRENCY);
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

    const nextRole = roleId ?? null;
    const hasStoredRole =
      (await db.getKey(STORE.ROLE_META, META_KEY.SYNC_ROLE)) !== undefined;
    const storedRole = await db.get(STORE.ROLE_META, META_KEY.SYNC_ROLE);

    if (!hasStoredRole) {
      await db.put(STORE.ROLE_META, nextRole, META_KEY.SYNC_ROLE);
    }

    const commonSyncTableConfig = {
      supabase,
      db,
      changedIds,
      changedCategoryMeta,
    };

    if (
      (!hasStoredRole || storedRole !== nextRole) &&
      !isPublic &&
      roleId !== undefined
    ) {
      await Promise.all(
        ROLE_SYNCED_TABLES.map((table) =>
          limit(() =>
            syncTableForRole({
              ...commonSyncTableConfig,
              table,
              roleId,
              lastSync: tablesToSync.find((t) => t.table === table)?.lastSync,
            }),
          ),
        ),
      );
      await db.put(STORE.ROLE_META, nextRole, META_KEY.SYNC_ROLE);
    }

    const lookupTableChanges = await Promise.all(
      tablesToSync.map(({ table, idbLastSync, lastSync }) =>
        limit(() =>
          syncTable({
            ...commonSyncTableConfig,
            table,
            idbLastSync,
            lastSync,
          }),
        ),
      ),
    );

    postMessage({
      type: WORKER_MSG.SUCCESS,
      ...(await toSyncResult(
        db,
        changedCategoryMeta,
        changedIds,
        lookupTableChanges.some(Boolean),
      )),
    });
  } catch (err) {
    postMessage({ type: WORKER_MSG.ERROR, message: errorMessage(err) });
  }
};
