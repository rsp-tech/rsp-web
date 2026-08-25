import {
  ROLE_SYNCED_TABLES,
  USER_SPECIFIC_TABLES,
  WORKER_MSG,
} from "@/constants";
import { getDB } from "@/lib/idb";
import { errorMessage } from "@/lib/utils";
import type { SyncResult } from "@/types";
import { performRoleCleanup, performUserCleanup } from "./cleanup-helpers";
import { syncPublicData } from "./sync-public-helpers";
import { syncRoleData } from "./sync-role-helpers";
import { syncUserData } from "./sync-user-helpers";
import { syncCacheAndIDB } from "./utils";

type WorkerMessage =
  | {
      type: typeof WORKER_MSG.START_PUBLIC_SYNC;
      jobId?: string;
    }
  | {
      type: typeof WORKER_MSG.START_ROLE_SYNC;
      roleId: number;
      userId: string;
      accessToken: string;
      jobId?: string;
    }
  | {
      type: typeof WORKER_MSG.START_USER_SYNC;
      userId: string;
      accessToken: string;
      jobId?: string;
    }
  | {
      type: typeof WORKER_MSG.START_CLEANUP;
      roleId?: number;
      userId?: string;
      jobId?: string;
    };

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const data = event.data;
  const jobId = data.jobId;

  const progressCallback = (msg: string) =>
    postMessage({ type: WORKER_MSG.PROGRESS, message: msg, jobId });

  try {
    const db = await getDB();
    if (!db) throw new Error("Sync failed: IndexedDB not available");

    postMessage({
      type: WORKER_MSG.PROGRESS,
      message: "परिष्करोति… · Refining…",
      jobId,
    });

    let result: SyncResult | null = null;

    switch (data.type) {
      case WORKER_MSG.START_PUBLIC_SYNC:
        result = await syncPublicData(
          db,
          self.location.origin,
          progressCallback,
        );
        break;
      case WORKER_MSG.START_ROLE_SYNC:
        result = await syncRoleData(
          db,
          self.location.origin,
          data,
          progressCallback,
        );
        break;
      case WORKER_MSG.START_USER_SYNC:
        result = await syncUserData(
          db,
          self.location.origin,
          data,
          progressCallback,
        );
        break;
      case WORKER_MSG.START_CLEANUP: {
        const [{ clearedRole }, { clearedUser }] = await Promise.all([
          performRoleCleanup(db, data.roleId),
          performUserCleanup(db, data.userId),
          syncCacheAndIDB(db),
        ]);
        result = {
          clearedUser,
          clearedRole,
          changedCategoryPaths: clearedRole ? ["*"] : [],
          changedIds: { recordings: [], categories: [], materials: [] },
          newAdditions: {
            recordings: [],
            materials: [],
            categories: [],
            replies: [],
            requests: [],
          },
          changedTables: [
            ...(clearedRole ? ROLE_SYNCED_TABLES : []),
            ...(clearedUser ? USER_SPECIFIC_TABLES : []),
          ],
          rebuildSearchIndex: clearedRole,
        };
        break;
      }
    }

    if (!result)
      throw new Error(`Unknown action: ${data.type} or something went wrong`);

    postMessage({
      type: WORKER_MSG.SUCCESS,
      jobId,
      ...result,
    });
  } catch (err) {
    postMessage({
      type: WORKER_MSG.ERROR,
      jobId,
      message: errorMessage(err),
    });
  }
};
