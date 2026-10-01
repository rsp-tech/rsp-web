import { type NextRequest, NextResponse } from "next/server";
import type { Json } from "@/database.types";
import { axiomLogger, withApiLogging } from "@/lib/axiom-logger";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { QueryAttachment } from "@/types";
import { validateQueryAttachments } from "../query-utils";

interface QueryReplyBody {
  query_id: string;
  user_id?: string | null;
  message: string;
  attachments?: QueryAttachment[];
}

export const POST = withApiLogging(
  "/api/queries/reply",
  async (req: NextRequest) => {
    try {
      const body = (await req.json()) as QueryReplyBody;

      if (!body.query_id || (!body.message && !body.attachments?.length)) {
        return NextResponse.json(
          {
            error: "Missing required fields (query_id, message or attachments)",
          },
          { status: 400 },
        );
      }

      const attachmentError = await validateQueryAttachments(
        body.attachments,
        body.user_id,
      );
      if (attachmentError) return attachmentError;

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
          event: "queries.reply_insert_error",
          route: "/api/queries/reply",
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
      throw err;
    }
  },
);
