import { type NextRequest, NextResponse } from "next/server";
import { axiomLogger, withApiLogging } from "@/lib/axiom-logger";
import type { SyncRequestBody } from "@/types";
import { getAuthenticatedRoleId } from "./auth";
import { computePublicSyncDelta, computeRoleSyncDelta } from "./delta-service";
import { fetchBackupAsset } from "./utils";

const SYNC_RESOURCE = process.env["SYNC_RESOURCE"];

if (!SYNC_RESOURCE) {
  throw new Error("Missing SYNC_RESOURCE");
}

const handleSyncDeltaError = (
  error: unknown,
  event: string,
  context: string,
): NextResponse => {
  console.error(`${context} failed:`, error);
  axiomLogger.error(`${context} failed`, {
    event,
    route: "/api/sync",
    error: error instanceof Error ? error.message : String(error),
  });
  return NextResponse.json(
    { error: error instanceof Error ? error.message : String(error) },
    { status: 500 },
  );
};

export const GET = withApiLogging("/api/sync", async (request: NextRequest) => {
  const { searchParams } = request.nextUrl;
  const entries = Array.from(searchParams.entries());

  // 1. If no query params: return the static public zip seed
  if (entries.length === 0) {
    return fetchBackupAsset(SYNC_RESOURCE);
  }

  // 2. Otherwise: compute 100% public diff based on query watermarks
  try {
    const watermarks: Record<string, string> = Object.fromEntries(entries);
    const result = await computePublicSyncDelta(watermarks);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control":
          "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return handleSyncDeltaError(
      error,
      "sync.public_error",
      "Public sync delta",
    );
  }
});

export const POST = withApiLogging(
  "/api/sync",
  async (request: NextRequest) => {
    try {
      const body = (await request.json()) as SyncRequestBody;

      if (!body?.watermarks || typeof body.watermarks !== "object") {
        return NextResponse.json(
          { error: "Invalid sync payload: watermarks object required" },
          { status: 400 },
        );
      }

      // Role-specific sync: resolve role_id strictly from JWT on the server
      const { roleId, errorResponse } = await getAuthenticatedRoleId(request);
      if (errorResponse) {
        return errorResponse;
      }

      if (!roleId) {
        return NextResponse.json(
          { error: "Forbidden: user has no restricted role assigned" },
          { status: 403 },
        );
      }

      const result = await computeRoleSyncDelta(body.watermarks, roleId);
      return NextResponse.json(result);
    } catch (error) {
      return handleSyncDeltaError(error, "sync.role_error", "Role sync delta");
    }
  },
);
