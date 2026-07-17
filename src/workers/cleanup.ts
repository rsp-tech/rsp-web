import type { IDBPDatabase } from "idb";
import { META_KEY, STORE, WORKER_MSG } from "@/constants";
import type { RSP_IDB } from "@/lib/idb";
import { getDB } from "@/lib/idb";
import { errorMessage } from "@/lib/utils";

type CleanupTable = "categories" | "recordings" | "materials";

const TABLES: CleanupTable[] = [
  STORE.CATEGORIES,
  STORE.RECORDINGS,
  STORE.MATERIALS,
];

const isAllowed = (
  allowedRoles: number[],
  roleId: number | undefined,
): boolean =>
  allowedRoles.includes(0) ||
  (roleId !== undefined && allowedRoles.includes(roleId));

const cleanupTable = async (
  db: IDBPDatabase<RSP_IDB>,
  table: CleanupTable,
  roleId: number | undefined,
) => {
  const tx = db.transaction(table, "readwrite");
  let cursor = await tx.store.openCursor();
  while (cursor) {
    if (!isAllowed(cursor.value.allowed_roles, roleId)) await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
};

type WorkerMessage = {
  type: typeof WORKER_MSG.START_CLEANUP;
  role: number | undefined;
};

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, role } = event.data;
  if (type !== WORKER_MSG.START_CLEANUP) return;

  try {
    const db = await getDB();
    if (!db) {
      postMessage({
        type: WORKER_MSG.ERROR,
        message: "IndexedDB not available",
      });
      return;
    }

    const nextRole = role ?? null;
    const hasStoredRole =
      (await db.getKey(STORE.ROLE_META, META_KEY.CLEANUP_ROLE)) !== undefined;
    const storedRole = await db.get(STORE.ROLE_META, META_KEY.CLEANUP_ROLE);

    if (!hasStoredRole) {
      await db.put(STORE.ROLE_META, nextRole, META_KEY.CLEANUP_ROLE);
      postMessage({ type: WORKER_MSG.SKIPPED, reason: "No previous role" });
      return;
    }

    if (storedRole === nextRole) {
      postMessage({ type: WORKER_MSG.SKIPPED, reason: "Roles are same" });
      return;
    }

    await Promise.all(TABLES.map((t) => cleanupTable(db, t, role)));
    await db.put(STORE.ROLE_META, nextRole, META_KEY.CLEANUP_ROLE);

    if (!nextRole) {
      await db.put(STORE.ROLE_META, null, META_KEY.SYNC_ROLE);
    }

    postMessage({ type: WORKER_MSG.SUCCESS });
  } catch (err) {
    postMessage({
      type: WORKER_MSG.ERROR,
      message: errorMessage(err),
    });
  }
};
