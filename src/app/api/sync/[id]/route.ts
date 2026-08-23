import type { NextRequest } from "next/server";
import { getAuthenticatedRoleId } from "../auth";
import { fetchBackupAsset } from "../utils";

export const revalidate = 86400; // 24 hours

const SYNC_RESOURCE = process.env["SYNC_RESOURCE"];

if (!SYNC_RESOURCE) {
  throw new Error("Missing SYNC_RESOURCE");
}

export const GET = async (request: NextRequest) => {
  try {
    const { roleId, errorResponse } = await getAuthenticatedRoleId(request);
    if (errorResponse || !roleId) {
      return errorResponse || new Response("Unauthorized", { status: 401 });
    }

    return await fetchBackupAsset(
      SYNC_RESOURCE.replace(".zip", `-${roleId}.zip`),
    );
  } catch (error) {
    console.error(error);
    return new Response("Failed to fetch backup", {
      status: 502,
    });
  }
};
