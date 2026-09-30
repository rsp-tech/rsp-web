import { cacheLife, cacheTag } from "next/cache";
import { CACHE_TAG } from "@/app/api/constants";
import { STORE } from "@/constants";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { toUpdatedAtMap } from "@/lib/sync-utils";

export const getCachedSyncMeta = async (): Promise<Record<string, string>> => {
  "use cache";
  cacheLife("days");
  cacheTag(CACHE_TAG.SYNC_META);

  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from(STORE.SYNC_META)
    .select("id, updated_at");

  if (error) {
    throw new Error(`Failed to fetch sync_meta: ${error.message}`);
  }

  return toUpdatedAtMap(data || []);
};

