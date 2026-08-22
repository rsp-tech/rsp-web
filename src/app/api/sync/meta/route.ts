import { unstable_cache } from "next/cache";
import { NextResponse } from "next/server";
import {
  CACHE_KEY,
  CACHE_TAG,
  REVALIDATE_8_HOURS,
} from "@/app/api/constants";
import { STORE } from "@/constants";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const revalidate = 28800; // 8 hours

const getCachedSyncMeta = unstable_cache(
  async () => {
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase
      .from(STORE.SYNC_META)
      .select("id, updated_at");

    if (error) {
      throw new Error(`Failed to fetch sync_meta: ${error.message}`);
    }

    return data;
  },
  [CACHE_KEY.SYNC_META],
  {
    revalidate: REVALIDATE_8_HOURS,
    tags: [CACHE_TAG.SYNC_META],
  },
);

export const GET = async () => {
  try {
    const data = await getCachedSyncMeta();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "public, max-age=28800, s-maxage=28800, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
};
