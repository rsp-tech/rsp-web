import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/database.types";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./constants";

let client: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseClient() {
  if (!client) {
    client = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
  }
  return client;
}
