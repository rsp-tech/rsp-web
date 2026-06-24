import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/constants";
import type { Database } from "@/database.types";

export const getSupabaseServerClient = () =>
  createClient<Database, "prod">(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
    db: {
      schema: "prod",
    },
  });
