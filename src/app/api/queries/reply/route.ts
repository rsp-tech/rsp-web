import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

interface QueryReplyBody {
  query_id: string;
  user_id?: string | null;
  message: string;
}

export const POST = async (req: NextRequest) => {
  try {
    const body = (await req.json()) as QueryReplyBody;

    if (!body.query_id || !body.message) {
      return NextResponse.json(
        { error: "Missing required fields (query_id, message)" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("query_replies")
      .insert({
        query_id: body.query_id,
        user_id: body.user_id ?? null,
        message: body.message,
      })
      .select("*, users(name, email)")
      .single();

    if (error) {
      console.error("Failed to insert query reply:", error);
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
    const errorMessage =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
};
