import { type NextRequest, NextResponse } from "next/server";
import { FEATURE_FLAGS } from "@/constants";
import type { Json } from "@/database.types";
import { axiomLogger } from "@/lib/axiom-logger";
import { isFeatureFlagEnabled } from "@/lib/feature-flags-service";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { QueryAttachment } from "@/types";
import { validateAttachments } from "../query-utils";

interface QueryReplyBody {
  query_id: string;
  user_id?: string | null;
  message: string;
  attachments?: QueryAttachment[];
}

export const POST = async (req: NextRequest) => {
  try {
    const body = (await req.json()) as QueryReplyBody;

    if (!body.query_id || (!body.message && !body.attachments?.length)) {
      return NextResponse.json(
        { error: "Missing required fields (query_id, message or attachments)" },
        { status: 400 },
      );
    }

    const attachError = validateAttachments(body.attachments, 5);
    if (attachError) {
      return NextResponse.json({ error: attachError }, { status: 400 });
    }

    const hasFiles = (body.attachments ?? []).some(
      (a) => a.type === "image" || a.type === "pdf",
    );
    if (hasFiles) {
      const allowed = await isFeatureFlagEnabled(
        FEATURE_FLAGS.QUERY_FILE_UPLOADS,
        body.user_id,
      );
      if (!allowed) {
        return NextResponse.json(
          { error: "File uploads are currently disabled" },
          { status: 403 },
        );
      }
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("query_replies")
      .insert({
        query_id: body.query_id,
        user_id: body.user_id ?? null,
        message: body.message || "",
        attachments: (body.attachments ?? []) as unknown as Json,
      })
      .select("*, users(name, email)")
      .single();

    if (error) {
      console.error("Failed to insert query reply:", error);
      axiomLogger.error("Failed to insert query reply", {
        error: error.message,
        query_id: body.query_id,
      });
      return NextResponse.json(
        { error: error.message || "Database insert failed" },
        { status: 500 },
      );
    }

    // Also update parent query's updated_at timestamp
    await supabase
      .from("user_queries")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", body.query_id);

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    console.error("Error processing reply submit route:", err);
    axiomLogger.error("Error processing reply submit route", { error: err });
    const errorMessage =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
};
