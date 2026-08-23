import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/constants";
import type { Database } from "@/database.types";

const SUPABASE_SECRET_KEY = process.env["SUPABASE_SECRET_KEY"];

if (!SUPABASE_SECRET_KEY) throw new Error("Missing SUPABASE_SECRET_KEY");

export const getSupabaseServerClient = () =>
  createClient<Database, "prod">(SUPABASE_URL, SUPABASE_SECRET_KEY, {
    db: {
      schema: "prod",
    },
  });
