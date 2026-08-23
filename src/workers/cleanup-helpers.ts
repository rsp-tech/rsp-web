import type { IDBPDatabase } from "idb";
import { META_KEY, STORE } from "@/constants";
import type { RSP_IDB } from "@/lib/idb";

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

export interface CleanupResult {
  clearedUser: boolean;
  clearedRole: boolean;
}

export const performCleanup = async (
  db: IDBPDatabase<RSP_IDB>,
  roleId: number | undefined,
  userId: string | null,
): Promise<CleanupResult> => {
  // 1. Get stored metadata
  const hasStoredRole =
    (await db.getKey(STORE.ROLE_META, META_KEY.CLEANUP_ROLE)) !== undefined;
  const storedRole = await db.get(STORE.ROLE_META, META_KEY.CLEANUP_ROLE);

  const hasStoredUserId =
    (await db.getKey(STORE.ROLE_META, META_KEY.CLEANUP_USER_ID)) !== undefined;
  const storedUserId = await db.get(STORE.ROLE_META, META_KEY.CLEANUP_USER_ID);

  // Save initial state if not present (e.g. first run of database)
  if (!hasStoredRole && !hasStoredUserId) {
    await Promise.all([
      db.put(STORE.ROLE_META, roleId, META_KEY.CLEANUP_ROLE),
      db.put(STORE.ROLE_META, userId, META_KEY.CLEANUP_USER_ID),
      db.put(STORE.ROLE_META, roleId, META_KEY.SYNC_ROLE),
    ]);
    return { clearedUser: false, clearedRole: false };
  }

  let clearedUser = false;
  let clearedRole = false;

  // 2. User shift cleanup (logout, login, or different user)
  if (storedUserId !== userId) {
    await Promise.all(USER_SPECIFIC_TABLES.map((t) => db.clear(t)));
    clearedUser = true;
  }

  // 3. Role-based cleanup (role changes)
  if (storedRole !== roleId) {
    await Promise.all(TABLES.map((t) => cleanupTable(db, t, roleId)));
    clearedRole = true;
  }

  // 4. Update metadata atomically
  await Promise.all([
    db.put(STORE.ROLE_META, roleId, META_KEY.CLEANUP_ROLE),
    db.put(STORE.ROLE_META, userId, META_KEY.CLEANUP_USER_ID),
    db.put(STORE.ROLE_META, roleId, META_KEY.SYNC_ROLE),
  ]);

  return { clearedUser, clearedRole };
};
