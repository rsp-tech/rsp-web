import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "../constants";

let client: ReturnType<typeof createClient<Database, "prod">> | null = null;

export const getSupabaseClient = () => {
  if (!client) {
    client = createClient<Database, "prod">(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        db: {
          schema: "prod",
        },
      },
    );
  }
  return client;
};
