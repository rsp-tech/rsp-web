import type { IDBPDatabase } from "idb";
import {
  GENERIC_TABLES,
  INVALIDATE_ALL_THRESHOLD,
  META_KEY,
  SEARCH_LOOKUP_TABLES,
  STORE,
  WORKER_MSG,
} from "@/constants";
import { getDB, type RSP_IDB } from "@/lib/idb";
import { toUpdatedAtMap } from "@/lib/sync-utils";
import { errorMessage } from "@/lib/utils";
import type {
  SyncChangedIds,
  SyncNewAdditions,
  SyncResult,
  SyncTable,
} from "@/types";
import { performCleanup } from "./cleanup-helpers";
import {
  applyDeltas,
  type ChangedCategoryMeta,
  fetchPublicSyncDeltas,
  fetchRoleSyncDeltas,
  isDatabaseStale,
  loadStaticZipSeeds,
  loadStaticZipSeedsForRole,
  mergeDeltas,
} from "./utils";

type WorkerMessage = {
  type: typeof WORKER_MSG.START_SYNC;
  supabaseUrl: string;
  supabaseKey: string;
  accessToken: string;
  roleId?: number;
  userId?: string | null;
  isPublic?: boolean;
  targetTables?: SyncTable[];
};

const toSyncResult = async (
  db: IDBPDatabase<RSP_IDB>,
  changedCategoryMeta: ChangedCategoryMeta,
  changedIds: SyncChangedIds,
  changedTables: string[],
  newAdditions: SyncNewAdditions,
  clearedUser?: boolean,
  clearedRole?: boolean,
): Promise<SyncResult> => {
  const rebuildSearchIndex =
    changedTables.some((table) =>
      (SEARCH_LOOKUP_TABLES as readonly string[]).includes(table),
    ) || Boolean(clearedRole);
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
    clearedUser,
    clearedRole,
    changedCategoryPaths,
    changedIds: {
      recordings: Array.from(new Set(changedIds.recordings ?? [])),
      categories: Array.from(new Set(changedIds.categories ?? [])),
      materials: Array.from(new Set(changedIds.materials ?? [])),
    },
    newAdditions: {
      recordings: Array.from(new Set(newAdditions.recordings)),
      materials: Array.from(new Set(newAdditions.materials)),
      categories: Array.from(new Set(newAdditions.categories)),
      replies: Array.from(new Set(newAdditions.replies)),
      requests: Array.from(new Set(newAdditions.requests)),
    },
    changedTables,
    rebuildSearchIndex,
  };
};

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, accessToken, roleId, userId, isPublic, targetTables } =
    event.data;
  if (type !== WORKER_MSG.START_SYNC) return;

  try {
    const db = await getDB();
    if (!db) throw new Error("Sync failed: IndexedDB not available");

    postMessage({
      type: WORKER_MSG.PROGRESS,
      message: "परिष्करोति… · Refining…",
    });

    // Phase 1: Local Cleanup & Store Purge
    const { clearedUser, clearedRole } = await performCleanup(
      db,
      roleId,
      userId ?? null,
    );

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

    const seedSuccessPayload = {
      type: WORKER_MSG.SUCCESS,
      clearedUser,
      clearedRole,
      changedCategoryPaths: ["*"],
      changedIds,
      newAdditions,
      changedTables: [],
      rebuildSearchIndex: true,
    };

    const isStale = await isDatabaseStale(db);
    let loadedStaticSeed = false;

    // Optimize first-time sync or stale (> MAX_SYNC_STALE_DAYS) database by loading pre-compiled static ZIP database seed
    if (isStale) {
      try {
        postMessage({
          type: WORKER_MSG.PROGRESS,
          message: "उत्कर्षयति… · Optimizing…",
        });

        const loaded = await loadStaticZipSeeds(db, self.location.origin);
        if (loaded) {
          loadedStaticSeed = true;
        }
      } catch (zipErr) {
        // Fallback silently to dynamic sync if static files fail
        console.error(
          "Static sync ZIP seed failed, falling back to dynamic sync:",
          zipErr,
        );
      }
    }

    const nextRole = roleId ?? null;
    const storedRole = await db.get(STORE.ROLE_META, META_KEY.SYNC_ROLE);

    const hasStoredRole = !!storedRole;
    if (!hasStoredRole) {
      await db.put(STORE.ROLE_META, nextRole, META_KEY.SYNC_ROLE);
    }

    if (
      (!hasStoredRole || storedRole !== nextRole || isStale) &&
      !isPublic &&
      roleId !== undefined
    ) {
      try {
        postMessage({
          type: WORKER_MSG.PROGRESS,
          message: "उत्कर्षयति… · Optimizing role data…",
        });
        const loaded = await loadStaticZipSeedsForRole(
          db,
          self.location.origin,
          roleId,
          accessToken,
        );
        if (loaded) {
          loadedStaticSeed = true;
          await db.put(STORE.ROLE_META, nextRole, META_KEY.SYNC_ROLE);
        }
      } catch (zipErr) {
        // Fallback silently to delta sync if static role seed fails
        console.error(
          "Static sync ZIP seed for role failed, falling back to delta sync:",
          zipErr,
        );
      }
    } else if (isPublic) {
      await db.put(STORE.ROLE_META, null, META_KEY.SYNC_ROLE);
    }

    if (loadedStaticSeed) {
      postMessage(seedSuccessPayload);
      return;
    }

    // Collect current local watermarks from IndexedDB
    const idbSyncMeta = toUpdatedAtMap(await db.getAll(STORE.SYNC_META));

    const targetTableList = targetTables?.length
      ? targetTables
      : GENERIC_TABLES;

    let changedTables: string[] = [];

    // 1. Edge-cached pre-flight check via GET /api/sync/meta (304 / 0 lambda invocations)
    const rawTag = Object.entries(idbSyncMeta)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join("|");
    const clientEtag = rawTag ? `"${btoa(rawTag)}"` : "";

    const metaHeaders: Record<string, string> = {};
    if (clientEtag) {
      metaHeaders["If-None-Match"] = clientEtag;
    }

    const metaRes = await fetch(`${self.location.origin}/api/sync/meta`, {
      headers: metaHeaders,
    });

    if (metaRes.ok && metaRes.status !== 304) {
      const serverMeta = (await metaRes.json()) as Record<string, string>;

      // Check if any requested table has a newer server watermark
      const hasDirtyTables = targetTableList.some((table) => {
        const serverTime = serverMeta[table];
        return serverTime && serverTime > (idbSyncMeta[table] || "");
      });

      // 2. Perform delta sync when newer data exists on the server
      if (hasDirtyTables) {
        const watermarks: Record<string, string> = Object.fromEntries(
          targetTableList.map((t) => [t, idbSyncMeta[t] || ""]),
        );

        // Fetch public and role deltas in parallel, keeping server pipelines completely separate
        const isRestrictedRole = !isPublic && !!accessToken;
        const [publicDeltaResult, roleDeltaResult] = await Promise.all([
          fetchPublicSyncDeltas(self.location.origin, watermarks),
          isRestrictedRole
            ? fetchRoleSyncDeltas(self.location.origin, watermarks, accessToken)
            : Promise.resolve(null),
        ]);

        const mergedDeltas = mergeDeltas(
          publicDeltaResult?.deltas,
          roleDeltaResult?.deltas,
        );

        const latestSyncMeta = {
          ...(publicDeltaResult?.sync_meta || {}),
          ...(roleDeltaResult?.sync_meta || {}),
        };

        if (Object.keys(mergedDeltas).length > 0) {
          changedTables = await applyDeltas(
            db,
            mergedDeltas,
            latestSyncMeta,
            idbSyncMeta,
            changedIds,
            changedCategoryMeta,
            newAdditions,
          );
        }
      }
    }

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
        newAdditions,
        clearedUser,
        clearedRole,
      )),
    });
  } catch (err) {
    postMessage({ type: WORKER_MSG.ERROR, message: errorMessage(err) });
  }
};
