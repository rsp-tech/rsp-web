import type { IDBPDatabase } from "idb";
import {
  INVALIDATE_ALL_THRESHOLD,
  META_KEY,
  SEARCH_LOOKUP_TABLES,
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
  loadStaticZipSeeds,
  loadStaticZipSeedsForRole,
  syncTable,
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
  changedTables: string[],
): Promise<SyncResult> => {
  const rebuildSearchIndex = changedTables.some((table) =>
    (SEARCH_LOOKUP_TABLES as readonly string[]).includes(table),
  );
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
            )?.category_id,
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
    changedTables,
    rebuildSearchIndex,
  };
};

const SEED_LOAD_SUCCESS_PAYLOAD = {
  type: WORKER_MSG.SUCCESS,
  changedCategoryPaths: ["*"],
  changedIds: {},
  rebuildSearchIndex: true,
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

    // Optimize first-time sync by loading pre-compiled static ZIP database seed
    const idbSyncMetaCount = await db.count(STORE.SYNC_META);

    if (idbSyncMetaCount === 0) {
      try {
        postMessage({
          type: WORKER_MSG.PROGRESS,
          message: "seeding database...",
        });

        const loaded = await loadStaticZipSeeds(db, self.location.origin);
        if (loaded) {
          postMessage(SEED_LOAD_SUCCESS_PAYLOAD);
        }
      } catch (zipErr) {
        // Fallback silently to normal Supabase sync if static files fail
        console.error(
          "Static sync ZIP seed failed, falling back to dynamic Supabase sync:",
          zipErr,
        );
      }
    }

    const tablesToSync = await getTablesToSync(db, self.location.origin);

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
    const storedRole = await db.get(STORE.ROLE_META, META_KEY.SYNC_ROLE);

    const hasStoredRole = !!storedRole;
    if (!hasStoredRole) {
      await db.put(STORE.ROLE_META, nextRole, META_KEY.SYNC_ROLE);
    }

    if (
      (!hasStoredRole || storedRole !== nextRole) &&
      !isPublic &&
      roleId !== undefined
    ) {
      try {
        postMessage({
          type: WORKER_MSG.PROGRESS,
          message: "seeding database for role...",
        });
        const loaded = await loadStaticZipSeedsForRole(
          db,
          self.location.origin,
          roleId,
          accessToken,
        );
        if (loaded) {
          postMessage(SEED_LOAD_SUCCESS_PAYLOAD);
          await db.put(STORE.ROLE_META, nextRole, META_KEY.SYNC_ROLE);
        }
      } catch (zipErr) {
        // Fallback silently to normal Supabase sync if static files fail
        console.error(
          "Static sync ZIP seed for role failed, falling back to dynamic Supabase sync:",
          zipErr,
        );
      }
    } else if (isPublic) {
      await db.put(STORE.ROLE_META, null, META_KEY.SYNC_ROLE);
    }

    const changedTables = (
      await Promise.all(
        tablesToSync.map(({ table, idbLastSync, lastSync }) =>
          limit(() =>
            syncTable({
              supabase,
              db,
              changedIds,
              changedCategoryMeta,
              table,
              idbLastSync,
              lastSync,
            }),
          ),
        ),
      )
    ).filter((table): table is string => Boolean(table));

    // Sync browser caches with IndexedDB STORE.CACHE_LEDGER
    if (typeof self.caches !== "undefined") {
      try {
        const cache = await self.caches.open("rsp-audio-cache");
        const keys = await cache.keys();
        for (const req of keys) {
          const audioId = new URL(req.url).pathname.split("/").pop() || "";
          if (!audioId) continue;

          // Check if it already exists in the ledger
          const ledgerEntry = await db.get(STORE.CACHE_LEDGER, audioId);
          if (!ledgerEntry) {
            // Find corresponding recording in STORE.RECORDINGS where audio_id === audioId
            const tx = db.transaction(STORE.RECORDINGS, "readonly");
            let cursor = await tx.store.openCursor();
            let recId: number | null = null;
            while (cursor) {
              if (cursor.value.audio_id === audioId) {
                recId = cursor.value.id;
                break;
              }
              cursor = await cursor.continue();
            }

            if (recId !== null) {
              // Fetch cache response to get the size
              const cachedResponse = await cache.match(req);
              let size = 0;
              if (cachedResponse) {
                const contentLength =
                  cachedResponse.headers.get("content-length");
                if (contentLength) {
                  size = parseInt(contentLength, 10);
                } else {
                  const blob = await cachedResponse.clone().blob();
                  size = blob.size;
                }
              }

              // Put entry in the ledger
              await db.put(STORE.CACHE_LEDGER, {
                id: audioId,
                recId,
                accessedAt: Date.now(),
                size,
              });
            }
          }
        }
      } catch (cacheErr) {
        console.error(
          "Failed to sync cache ledger entries in worker:",
          cacheErr,
        );
      }
    }

    postMessage({
      type: WORKER_MSG.SUCCESS,
      ...(await toSyncResult(
        db,
        changedCategoryMeta,
        changedIds,
        changedTables,
      )),
    });
  } catch (err) {
    postMessage({ type: WORKER_MSG.ERROR, message: errorMessage(err) });
  }
};
