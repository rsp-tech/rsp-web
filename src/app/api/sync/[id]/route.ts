import type { NextRequest } from "next/server";
import { axiomLogger, withApiLogging } from "@/lib/axiom-logger";
import { getAuthenticatedRoleId } from "../auth";
import { fetchBackupAsset } from "../utils";

const SYNC_RESOURCE = process.env["SYNC_RESOURCE"];

if (!SYNC_RESOURCE) {
  throw new Error("Missing SYNC_RESOURCE");
}

export const GET = withApiLogging(
  "/api/sync/[id]",
  async (request: NextRequest) => {
    try {
      const { roleId, errorResponse } = await getAuthenticatedRoleId(request);
      if (errorResponse || !roleId) {
        return errorResponse || new Response("Unauthorized", { status: 401 });
      }

      const res = await fetchBackupAsset(
        SYNC_RESOURCE.replace(".zip", `-${roleId}.zip`),
      );

      if (res.status === 404) {
        axiomLogger.warn(`Backup asset not found for role ${roleId}`, {
          event: "sync.role_backup_not_found",
          role_id: roleId,
          target_resource: SYNC_RESOURCE.replace(".zip", `-${roleId}.zip`),
        });
      }

      return res;
    } catch (error) {
      console.warn("[Sync Role Backup Error]", error);
      axiomLogger.error("Failed to fetch role backup zip", {
        event: "sync.role_backup_error",
        route: "/api/sync/[id]",
        error: error instanceof Error ? error.message : String(error),
      });
      return new Response("Failed to fetch backup", {
        status: 502,
      });
    }
  },
);
