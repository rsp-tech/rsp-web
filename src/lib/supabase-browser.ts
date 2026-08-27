import { createClient } from "@supabase/supabase-js";
import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "../constants";

/**
 * Browser-side Supabase client.
 *
 * IMPORTANT ARCHITECTURAL RULE:
 * This client is STRICTLY reserved for Client-side Auth (supabase.auth.*)
 * and Realtime Channels (supabase.channel(...)).
 *
 * DO NOT execute direct database queries (.from(...)) from the browser.
 * All mutations and server data access MUST go through Next.js Server Route Handlers (/api/...).
 */
let client: ReturnType<typeof createClient> | null = null;

export const getSupabaseClient = (accessToken?: string) => {
  if (!client) {
    client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      global: accessToken
        ? { headers: { Authorization: `Bearer ${accessToken}` } }
        : undefined,
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
  }
  return client;
};
