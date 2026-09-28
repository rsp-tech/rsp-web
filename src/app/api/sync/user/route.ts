import type { NextRequest } from "next/server";
import { STORE } from "@/constants";
import { axiomLogger } from "@/lib/axiom-logger";
import {
  evaluateUserFlags,
  getCachedFeatureFlags,
} from "@/lib/feature-flags-service";
import type { SyncRequestBody } from "@/types";
import { getAuthenticatedUser } from "../auth";
import { computeUserSyncDelta } from "../delta-service";

export const dynamic = "force-dynamic";

export const GET = async (request: NextRequest) => {
  try {
    const { user, errorResponse } = await getAuthenticatedUser(request);
    if (errorResponse || !user) {
      return errorResponse || new Response("Unauthorized", { status: 401 });
    }

    const [result, featureFlags] = await Promise.all([
      computeUserSyncDelta({}, user.id),
      getCachedFeatureFlags(),
    ]);

    const userFlags = evaluateUserFlags(featureFlags, user);

    return Response.json({
      sync_meta: result.sync_meta,
      user_feature_flags: userFlags,
      [STORE.USERS]: result.deltas[STORE.USERS] || [],
      [STORE.USER_EDIT_REQUESTS]: result.deltas[STORE.USER_EDIT_REQUESTS] || [],
      [STORE.USER_SERVICE_INTERESTS]:
        result.deltas[STORE.USER_SERVICE_INTERESTS] || [],
      [STORE.USER_QUERIES]: result.deltas[STORE.USER_QUERIES] || [],
      [STORE.QUERY_REPLIES]: result.deltas[STORE.QUERY_REPLIES] || [],
    });
  } catch (error) {
    console.error("Failed to fetch user seed backup:", error);
    axiomLogger.error("Failed to fetch user seed backup", {
      error: error instanceof Error ? error.message : String(error),
    });
    return new Response("Failed to fetch backup", {
      status: 502,
    });
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const { user, errorResponse } = await getAuthenticatedUser(request);
    if (errorResponse || !user) {
      return errorResponse || new Response("Unauthorized", { status: 401 });
    }

    const body = (await request.json()) as SyncRequestBody;
    const watermarks = body?.watermarks || {};

    const [result, featureFlags] = await Promise.all([
      computeUserSyncDelta(watermarks, user.id),
      getCachedFeatureFlags(),
    ]);

    const userFlags = evaluateUserFlags(featureFlags, user);

    return Response.json({
      ...result,
      user_feature_flags: userFlags,
    });
  } catch (error) {
    console.error("User delta sync failed:", error);
    axiomLogger.error("User delta sync failed", {
      error: error instanceof Error ? error.message : String(error),
    });
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
};
