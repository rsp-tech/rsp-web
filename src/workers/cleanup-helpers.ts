import type { IDBPDatabase } from "idb";
import {
  META_KEY,
  ROLE_SYNCED_TABLES,
  STORE,
  USER_SPECIFIC_TABLES,
} from "@/constants";
import type { RSP_IDB } from "@/lib/idb";

type CleanupTable = (typeof ROLE_SYNCED_TABLES)[number];

const ALL_ROLES = 0;

const isAllowed = (
  allowedRoles: number[] | undefined,
  roleId: number | undefined,
): boolean =>
  !allowedRoles?.length ||
  allowedRoles.includes(ALL_ROLES) ||
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
    await db.put(STORE.ROLE_META, roleId, META_KEY.CLEANUP_ROLE);
    return { clearedRole: false };
  }

  if (storedRole !== roleId) {
    for (const t of ROLE_SYNCED_TABLES) {
      await cleanupTable(db, t, roleId);
    }
    await db.clear(STORE.ROLE_SYNC_META);

    await db.put(STORE.ROLE_META, roleId, META_KEY.CLEANUP_ROLE);
    return { clearedRole: true };
  }

  return { clearedRole: false };
};

export const performUserCleanup = async (
  db: IDBPDatabase<RSP_IDB>,
  userId: string | undefined,
): Promise<UserCleanupResult> => {
  const hasStoredUserId =
    (await db.getKey(STORE.ROLE_META, META_KEY.CLEANUP_USER_ID)) !== undefined;
  const storedUserId = await db.get(STORE.ROLE_META, META_KEY.CLEANUP_USER_ID);

  if (!hasStoredUserId) {
    await db.put(STORE.ROLE_META, userId, META_KEY.CLEANUP_USER_ID);
    if (!userId) {
      await db.delete(STORE.ROLE_META, META_KEY.USER_FEATURES);
    }
    return { clearedUser: false };
  }

  if (storedUserId !== userId) {
    const tx = db.transaction(
      [...USER_SPECIFIC_TABLES, STORE.ROLE_META, STORE.SYNC_META],
      "readwrite",
    );

    for (const table of USER_SPECIFIC_TABLES) {
      await tx.objectStore(table).clear();
      await tx.objectStore(STORE.SYNC_META).delete(table);
    }
    await tx.objectStore(STORE.ROLE_META).delete(META_KEY.USER_FEATURES);

    await tx.objectStore(STORE.ROLE_META).put(userId, META_KEY.CLEANUP_USER_ID);

    await tx.done;

    return { clearedUser: true };
  }

  return { clearedUser: false };
};
