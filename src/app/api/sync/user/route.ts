import type { NextRequest } from "next/server";
import { STORE } from "@/constants";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { SyncRequestBody } from "@/types";
import { getCachedUserTable } from "../baseline-cache";
import { computeUserSyncDelta } from "../delta-service";

export const dynamic = "force-dynamic";

export const GET = async (request: NextRequest) => {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    const token = authHeader.slice(7);
    const supabase = getSupabaseServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    const [
      users,
      userEditRequests,
      userServiceInterests,
      userQueries,
      queryReplies,
    ] = await Promise.all([
      getCachedUserTable(STORE.USERS),
      getCachedUserTable(STORE.USER_EDIT_REQUESTS),
      getCachedUserTable(STORE.USER_SERVICE_INTERESTS),
      getCachedUserTable(STORE.USER_QUERIES),
      getCachedUserTable(STORE.QUERY_REPLIES),
    ]);

    const filteredUsers = users.filter((r) => r["id"] === user.id);
    const filteredEditRequests = userEditRequests.filter(
      (r) => r["user_id"] === user.id,
    );
    const filteredInterests = userServiceInterests.filter(
      (r) => r["user_id"] === user.id,
    );
    const filteredQueries = userQueries.filter((r) => r["user_id"] === user.id);

    const queryIds = new Set(
      filteredQueries.map((q) => String(q["id"])).filter(Boolean),
    );
    const filteredReplies = queryReplies.filter(
      (r) => r["query_id"] && queryIds.has(String(r["query_id"])),
    );

    return Response.json({
      [STORE.USERS]: filteredUsers,
      [STORE.USER_EDIT_REQUESTS]: filteredEditRequests,
      [STORE.USER_SERVICE_INTERESTS]: filteredInterests,
      [STORE.USER_QUERIES]: filteredQueries,
      [STORE.QUERY_REPLIES]: filteredReplies,
    });
  } catch (error) {
    console.error("Failed to fetch user seed backup:", error);
    return new Response("Failed to fetch backup", {
      status: 502,
    });
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader?.startsWith("Bearer ")) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    const token = authHeader.slice(7);
    const supabase = getSupabaseServerClient();

    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return new Response("Unauthorized", {
        status: 401,
      });
    }

    const body = (await request.json()) as SyncRequestBody;
    const watermarks = body?.watermarks || {};

    const result = await computeUserSyncDelta(watermarks, user.id);
    return Response.json(result);
  } catch (error) {
    console.error("User delta sync failed:", error);
    return Response.json({ error: (error as Error).message }, { status: 500 });
  }
};
