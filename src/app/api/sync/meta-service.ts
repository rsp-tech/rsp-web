import { unstable_cache } from "next/cache";
import { CACHE_TAG, REVALIDATE_24_HOURS } from "@/app/api/constants";
import { STORE } from "@/constants";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { toUpdatedAtMap } from "@/lib/sync-utils";

export const getCachedSyncMeta = unstable_cache(
  async (): Promise<Record<string, string>> => {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from(STORE.SYNC_META)
      .select("id, updated_at");

    if (error) {
      throw new Error(`Failed to fetch sync_meta: ${error.message}`);
    }

    return toUpdatedAtMap(data || []);
  },
  [CACHE_TAG.SYNC_META],
  {
    revalidate: REVALIDATE_24_HOURS,
    tags: [CACHE_TAG.SYNC_META],
  },
);
