import { createClient } from "@supabase/supabase-js";
import type { NextRequest } from "next/server";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/constants";
import type { Database } from "@/database.types";
import { fetchBackupAsset } from "../utils";

export const revalidate = 14400; // 4 hours

const SYNC_RESOURCE = process.env["SYNC_RESOURCE"];

if (!SYNC_RESOURCE) {
  throw new Error("Missing SYNC_RESOURCE");
}

export const GET = async (
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> },
) => {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response("Unauthorized", { status: 401 });
    }
    const token = authHeader.slice(7);

    const { id } = await ctx.params;

    const roleId = Number(id);

    if (!roleId) {
      return new Response("Bad Request: roleId is required", { status: 400 });
    }

    // Validate with supabase
    const supabase = createClient<Database>(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        db: {
          schema: "prod",
        },
      },
    );

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response("Unauthorized", { status: 401 });
    }

    if (user.app_metadata["role_id"] !== roleId) {
      return new Response("Forbidden: Role mismatch", { status: 403 });
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
