import { type NextRequest, NextResponse } from "next/server";
import type { SyncRequestBody } from "@/types";
import { verifyRoleSyncAuth } from "./auth";
import { computeSyncDelta } from "./delta-service";
import { fetchBackupAsset } from "./utils";

export const revalidate = 86400; // 24 hours

const SYNC_RESOURCE = process.env["SYNC_RESOURCE"];

if (!SYNC_RESOURCE) {
  throw new Error("Missing SYNC_RESOURCE");
}

export const GET = async () => fetchBackupAsset(SYNC_RESOURCE);

export const POST = async (request: NextRequest) => {
  try {
    const body = (await request.json()) as SyncRequestBody;

    if (!body?.watermarks || typeof body.watermarks !== "object") {
      return NextResponse.json(
        { error: "Invalid sync payload: watermarks object required" },
        { status: 400 },
      );
    }

    // Role authorization boundary: reject unauthenticated or mismatched role requests
    const authErrorResponse = await verifyRoleSyncAuth(request, body.roleId);
    if (authErrorResponse) {
      return authErrorResponse;
    }

    const result = await computeSyncDelta({
      watermarks: body.watermarks,
      roleId: body.roleId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Sync delta computation failed:", error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
};
