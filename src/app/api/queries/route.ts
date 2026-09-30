import { type NextRequest, NextResponse } from "next/server";
import { FEATURE_FLAGS } from "@/constants";
import type { Json } from "@/database.types";
import { withApiLogging } from "@/lib/axiom-logger";
import { isFeatureFlagEnabled } from "@/lib/feature-flags-service";
import {
  getSupabaseServerClient,
  handleMutationResult,
} from "@/lib/supabase-server";
import type { QueryAttachment } from "@/types";
import { validateAttachments } from "./query-utils";

interface QueryRequestBody {
  guest_name?: string | null;
  guest_email?: string | null;
  user_id?: string | null;
  category: string;
  subject: string;
  message: string;
  attachments?: QueryAttachment[];
}

export const POST = withApiLogging("/api/queries", async (req: NextRequest) => {
  try {
    const body = (await req.json()) as QueryRequestBody;

    if (!body.category || !body.subject || !body.message) {
      return NextResponse.json(
        { error: "Missing required fields (category, subject, message)" },
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
      .from("user_queries")
      .insert({
        guest_name: body.guest_name ?? null,
        guest_email: body.guest_email ?? null,
        user_id: body.user_id ?? null,
        category: body.category,
        subject: body.subject,
        message: body.message,
        attachments: (body.attachments ?? []) as unknown as Json,
      })
      .select()
      .single();

    return handleMutationResult(data, error, "insert user query on server");
  } catch (err: unknown) {
    console.error("Error processing query submit route:", err);
    throw err;
  }
});

interface QueryPatchRequestBody {
  query_id: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  user_id?: string | null;
}

const ALLOWED_STATUSES = new Set(["open", "in_progress", "resolved", "closed"]);

export const PATCH = withApiLogging("/api/queries", async (req: NextRequest) => {
  try {
    const body = (await req.json()) as QueryPatchRequestBody;

    if (!body.query_id || !body.status || !ALLOWED_STATUSES.has(body.status)) {
      return NextResponse.json(
        { error: "Invalid query_id or status" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();
    let query = supabase
      .from("user_queries")
      .update({
        status: body.status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.query_id);

    if (body.user_id) {
      query = query.eq("user_id", body.user_id);
    }

    const { data, error } = await query.select().single();

    return handleMutationResult(data, error, "update user query status");
  } catch (err: unknown) {
    console.error("Error updating query status:", err);
    throw err;
  }
});
