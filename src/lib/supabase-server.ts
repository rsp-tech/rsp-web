import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/constants";
import type { Database } from "@/database.types";
import { axiomLogger } from "@/lib/axiom-logger";

const SUPABASE_SECRET_KEY = process.env["SUPABASE_SECRET_KEY"];

if (!SUPABASE_SECRET_KEY) throw new Error("Missing SUPABASE_SECRET_KEY");

export const getSupabaseServerClient = () =>
  createClient<Database, "prod">(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    db: {
      schema: "prod",
    },
  });

export const handleMutationResult = <T>(
  data: T,
  error: { message?: string } | null,
  failureContext: string,
) => {
  if (error) {
    console.error(`Failed to ${failureContext}:`, error);
    axiomLogger.error(`Database mutation failed: ${failureContext}`, {
      error: error.message || "Database insert failed",
      context: failureContext,
    });
    return Response.json(
      { error: error.message || "Database insert failed" },
      { status: 500 },
    );
  }
  return Response.json({ success: true, data });
};
