import { type NextRequest, NextResponse } from "next/server";
import {
  getSupabaseServerClient,
  handleMutationResult,
} from "@/lib/supabase-server";

interface QueryRequestBody {
  guest_name?: string | null;
  guest_email?: string | null;
  user_id?: string | null;
  category: string;
  subject: string;
  message: string;
}

export const POST = async (req: NextRequest) => {
  try {
    const body = (await req.json()) as QueryRequestBody;

    if (!body.category || !body.subject || !body.message) {
      return NextResponse.json(
        { error: "Missing required fields (category, subject, message)" },
        { status: 400 },
      );
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
      })
      .select()
      .single();

    return handleMutationResult(data, error, "insert user query on server");
  } catch (err: unknown) {
    console.error("Error processing query submit route:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
};
