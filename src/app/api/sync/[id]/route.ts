import type { NextRequest } from "next/server";
import { verifyRoleSyncAuth } from "../auth";
import { fetchBackupAsset } from "../utils";

export const revalidate = 86400; // 24 hours

const SYNC_RESOURCE = process.env["SYNC_RESOURCE"];

if (!SYNC_RESOURCE) {
  throw new Error("Missing SYNC_RESOURCE");
}

export const GET = async (
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) => {
  try {
    const { id } = await ctx.params;
    const roleId = Number(id);

    if (!roleId) {
      return new Response("Bad Request: roleId is required", { status: 400 });
    }

    const authErrorResponse = await verifyRoleSyncAuth(request, roleId);
    if (authErrorResponse) {
      return authErrorResponse;
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
