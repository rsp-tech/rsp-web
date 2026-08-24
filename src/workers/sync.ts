import { WORKER_MSG } from "@/constants";
import { getDB } from "@/lib/idb";
import { errorMessage } from "@/lib/utils";
import type { SyncResult } from "@/types";
import { syncPublicData } from "./sync-public-helpers";
import { syncRoleData } from "./sync-role-helpers";
import { syncUserData } from "./sync-user-helpers";
import { syncCacheAndIDB } from "./utils";

type WorkerMessage =
  | {
      type: typeof WORKER_MSG.START_PUBLIC_SYNC;
    }
  | {
      type: typeof WORKER_MSG.START_ROLE_SYNC;
      roleId: number;
      userId: string;
      accessToken: string;
    }
  | {
      type: typeof WORKER_MSG.START_USER_SYNC;
      userId: string;
      accessToken: string;
    };

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const data = event.data;

  const progressCallback = (msg: string) =>
    postMessage({ type: WORKER_MSG.PROGRESS, message: msg });

  try {
    const db = await getDB();
    if (!db) throw new Error("Sync failed: IndexedDB not available");

    postMessage({
      type: WORKER_MSG.PROGRESS,
      message: "परिष्करोति… · Refining…",
    });

    let result: SyncResult | null = null;

    switch (data.type) {
      case WORKER_MSG.START_PUBLIC_SYNC:
        [result] = await Promise.all([
          syncPublicData(db, self.location.origin, progressCallback),
          syncCacheAndIDB(db),
        ]);
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
    }

    if (!result)
      throw new Error(`Unknown action: ${data.type} or something went wrong`);

    postMessage({
      type: WORKER_MSG.SUCCESS,
      ...result,
    });
  } catch (err) {
    postMessage({ type: WORKER_MSG.ERROR, message: errorMessage(err) });
  }
};
