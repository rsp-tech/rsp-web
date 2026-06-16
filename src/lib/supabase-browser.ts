import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "../constants";

let client: ReturnType<typeof createClient<Database, "prod">> | null = null;

export const getSupabaseClient = (accessToken?: string) => {
  if (!client) {
    client = createClient<Database, "prod">(
      SUPABASE_URL,
      SUPABASE_PUBLISHABLE_KEY,
      {
        global: accessToken
          ? { headers: { Authorization: `Bearer ${accessToken}` } }
          : undefined,
        db: {
          schema: "prod",
        },
      },
    );
  }
  return client;
};
