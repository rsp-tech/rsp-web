import type { IDBPDatabase } from "idb";
import type { RSPDatabase } from "@/lib/idb";
import { getDB } from "@/lib/idb";

type CleanupTable = "categories" | "recordings" | "materials";

const TABLES: CleanupTable[] = ["categories", "recordings", "materials"];

const isAllowed = (
  allowedRoles: number[],
  roleId: number | undefined,
): boolean =>
  allowedRoles.includes(0) ||
  (roleId !== undefined && allowedRoles.includes(roleId));

const cleanupTable = async (
  db: IDBPDatabase<RSPDatabase>,
  table: CleanupTable,
  roleId: number | undefined,
) => {
  const tx = db.transaction(table, "readwrite");
  let cursor = await tx.store.openCursor();
  while (cursor) {
    const allowed = (cursor.value as { allowed_roles: number[] }).allowed_roles;
    if (!isAllowed(allowed, roleId)) await cursor.delete();
    cursor = await cursor.continue();
  }
  await tx.done;
};

const ROLE_META_KEY = "cleanup_role";

self.onmessage = async (event: MessageEvent) => {
  const { type, role } = event.data;
  if (type !== "START_CLEANUP") return;

  try {
    const db = await getDB();
    if (!db) {
      postMessage({ type: "ERROR", message: "IndexedDB not available" });
      return;
    }

    const storedRole = await db.get("metadata", ROLE_META_KEY);

    if (!storedRole) {
      await db.put("metadata", role ?? null, ROLE_META_KEY);
      postMessage({ type: "SKIPPED", reason: "No previous role" });
      return;
    }

    if (storedRole === (role ?? null)) {
      postMessage({ type: "SKIPPED", reason: "Roles are same" });
      return;
    }

    await db.put("metadata", role ?? null, ROLE_META_KEY);

    await Promise.all(TABLES.map((t) => cleanupTable(db, t, role)));

    postMessage({ type: "SUCCESS" });
  } catch (err) {
    postMessage({
      type: "ERROR",
      message: err instanceof Error ? err.message : String(err),
    });
  }
};
