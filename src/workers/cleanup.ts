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

const USER_SPECIFIC_TABLES: (keyof RSP_IDB)[] = [
  STORE.USERS,
  STORE.USER_EDIT_REQUESTS,
  STORE.USER_SERVICE_INTERESTS,
  STORE.USER_QUERIES,
  STORE.QUERY_REPLIES,
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
  userId: string | null;
};

self.onmessage = async (event: MessageEvent<WorkerMessage>) => {
  const { type, role, userId } = event.data;
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
    const nextUserId = userId ?? null;

    // 1. Get stored metadata
    const hasStoredRole =
      (await db.getKey(STORE.ROLE_META, META_KEY.CLEANUP_ROLE)) !== undefined;
    const storedRole = await db.get(STORE.ROLE_META, META_KEY.CLEANUP_ROLE);

    const hasStoredUserId =
      (await db.getKey(STORE.ROLE_META, META_KEY.CLEANUP_USER_ID)) !==
      undefined;
    const storedUserId = await db.get(
      STORE.ROLE_META,
      META_KEY.CLEANUP_USER_ID,
    );

    // Save initial state if not present (e.g. first run of database)
    if (!hasStoredRole && !hasStoredUserId) {
      await Promise.all([
        db.put(STORE.ROLE_META, nextRole, META_KEY.CLEANUP_ROLE),
        db.put(STORE.ROLE_META, nextUserId, META_KEY.CLEANUP_USER_ID),
      ]);
      postMessage({ type: WORKER_MSG.SKIPPED, reason: "No previous state" });
      return;
    }

    // 2. User shift cleanup (logout, login, or different user)
    if (storedUserId !== nextUserId) {
      await Promise.all(USER_SPECIFIC_TABLES.map((t) => db.clear(t)));
    }

    // 3. Role-based cleanup (role changes)
    if (storedRole !== nextRole) {
      await Promise.all(TABLES.map((t) => cleanupTable(db, t, role)));
    }

    // 4. Update metadata
    await Promise.all([
      db.put(STORE.ROLE_META, nextRole, META_KEY.CLEANUP_ROLE),
      db.put(STORE.ROLE_META, nextUserId, META_KEY.CLEANUP_USER_ID),
    ]);

    if (!nextRole) {
      await db.put(STORE.ROLE_META, null, META_KEY.SYNC_ROLE);
    }

    postMessage({
      type: WORKER_MSG.SUCCESS,
      clearedUser: storedUserId !== nextUserId,
      clearedRole: storedRole !== nextRole,
    });
  } catch (err) {
    postMessage({
      type: WORKER_MSG.ERROR,
      message: errorMessage(err),
    });
  }
};
