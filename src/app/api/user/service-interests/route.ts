import { type NextRequest, NextResponse } from "next/server";
import { axiomLogger } from "@/lib/axiom-logger";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { UserServiceInterest } from "@/types";

interface ServiceInterestsBody {
  user_id: string;
  upsert?: Array<Omit<UserServiceInterest, "id" | "created_at" | "updated_at">>;
  delete_service_ids?: number[];
}

export const POST = async (req: NextRequest) => {
  try {
    const body = (await req.json()) as ServiceInterestsBody;

    if (!body.user_id) {
      return NextResponse.json({ error: "Missing user_id" }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();

    // 1. Handle Deletions
    if (body.delete_service_ids && body.delete_service_ids.length > 0) {
      const { error: deleteError } = await supabase
        .from("user_service_interests")
        .delete()
        .eq("user_id", body.user_id)
        .in("service_id", body.delete_service_ids);

      if (deleteError) {
        console.error("Failed to delete service interests:", deleteError);
        axiomLogger.error("Failed to delete service interests", {
          error: deleteError.message,
          userId: body.user_id,
        });
        return NextResponse.json(
          { error: deleteError.message },
          { status: 500 },
        );
      }
    }

    // 2. Handle Upserts
    let upsertData: UserServiceInterest[] = [];
    if (body.upsert && body.upsert.length > 0) {
      const { data, error: upsertError } = await supabase
        .from("user_service_interests")
        .upsert(body.upsert)
        .select();

      if (upsertError) {
        console.error("Failed to upsert service interests:", upsertError);
        axiomLogger.error("Failed to upsert service interests", {
          error: upsertError.message,
          userId: body.user_id,
        });
        return NextResponse.json(
          { error: upsertError.message },
          { status: 500 },
        );
      }

      if (data) {
        upsertData = data;
      }
    }

    return NextResponse.json({ success: true, data: upsertData });
  } catch (err: unknown) {
    console.error("Error processing service-interests submit route:", err);
    axiomLogger.error("Error processing service-interests submit route", {
      error: err,
    });
    const errorMessage =
      err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
};
