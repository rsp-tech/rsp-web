import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

interface EditRequestBody {
  user_id: string;
  name: string;
  phone?: string | null;
  temple?: string | null;
  ashram?: string | null;
  purpose?: string | null;
  authority_name?: string | null;
  authority_email?: string | null;
  authority_relationship?: string | null;
  requested_role_id?: number | null;
  reason?: string | null;
}

export const POST = async (req: NextRequest) => {
  try {
    const body = (await req.json()) as EditRequestBody;

    if (!body.user_id || !body.name) {
      return NextResponse.json(
        { error: "Missing required fields (user_id, name)" },
        { status: 400 },
      );
    }

    const supabase = getSupabaseServerClient();

    const { data, error } = await supabase
      .from("user_edit_requests")
      .insert({
        user_id: body.user_id,
        name: body.name,
        phone: body.phone ?? null,
        temple: body.temple ?? null,
        ashram: body.ashram ?? null,
        purpose: body.purpose ?? null,
        authority_name: body.authority_name ?? null,
        authority_email: body.authority_email ?? null,
        authority_relationship: body.authority_relationship ?? null,
        requested_role_id: body.requested_role_id ?? null,
        reason: body.reason ?? "Profile update request by user",
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to submit user edit request:", error);
      return NextResponse.json(
        { error: error.message || "Database insert failed" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    console.error("Error processing edit-request submit route:", err);
    const errorMessage =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
};
