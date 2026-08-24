import type { IDBPDatabase } from "idb";
import { META_KEY, STORE, USER_SPECIFIC_TABLES } from "@/constants";
import type { RSP_IDB } from "@/lib/idb";

type CleanupTable = "categories" | "recordings" | "materials";

const ROLE_TABLES: CleanupTable[] = [
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

export interface RoleCleanupResult {
  clearedRole: boolean;
}

export interface UserCleanupResult {
  clearedUser: boolean;
}

export const performRoleCleanup = async (
  db: IDBPDatabase<RSP_IDB>,
  roleId: number | undefined,
): Promise<RoleCleanupResult> => {
  const hasStoredRole =
    (await db.getKey(STORE.ROLE_META, META_KEY.CLEANUP_ROLE)) !== undefined;
  const storedRole = await db.get(STORE.ROLE_META, META_KEY.CLEANUP_ROLE);

  if (!hasStoredRole) {
    await Promise.all([
      db.put(STORE.ROLE_META, roleId, META_KEY.CLEANUP_ROLE),
      db.put(STORE.ROLE_META, roleId, META_KEY.SYNC_ROLE),
    ]);
    return { clearedRole: false };
  }

  if (storedRole !== roleId) {
    await Promise.all([
      ...ROLE_TABLES.map((t) => cleanupTable(db, t, roleId)),
      db.clear(STORE.ROLE_SYNC_META),
    ]);

    await Promise.all([
      db.put(STORE.ROLE_META, roleId, META_KEY.CLEANUP_ROLE),
      db.put(STORE.ROLE_META, roleId, META_KEY.SYNC_ROLE),
    ]);

    return { clearedRole: true };
  }

  return { clearedRole: false };
};

export const performUserCleanup = async (
  db: IDBPDatabase<RSP_IDB>,
  userId: string,
): Promise<UserCleanupResult> => {
  const hasStoredUserId =
    (await db.getKey(STORE.ROLE_META, META_KEY.CLEANUP_USER_ID)) !== undefined;
  const storedUserId = await db.get(STORE.ROLE_META, META_KEY.CLEANUP_USER_ID);

  if (!hasStoredUserId) {
    await db.put(STORE.ROLE_META, userId, META_KEY.CLEANUP_USER_ID);
    return { clearedUser: false };
  }

  if (storedUserId !== userId) {
    await Promise.all(USER_SPECIFIC_TABLES.map((t) => db.clear(t)));

    // Clear user table watermarks from sync_meta
    const syncMetaTx = db.transaction(STORE.SYNC_META, "readwrite");
    for (const table of USER_SPECIFIC_TABLES) {
      syncMetaTx.store.delete(table);
    }
    await syncMetaTx.done;

    await db.put(STORE.ROLE_META, userId, META_KEY.CLEANUP_USER_ID);
    return { clearedUser: true };
  }

  return { clearedUser: false };
};
