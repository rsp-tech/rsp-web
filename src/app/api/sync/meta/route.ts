import { NextResponse } from "next/server";
import {
  evaluatePublicFlags,
  getCachedFeatureFlags,
} from "@/lib/feature-flags-service";
import { getCachedSyncMeta } from "../meta-service";

export const revalidate = 86400; // 24 hours

const CACHE_CONTROL_HEADER =
  "public, max-age=0, s-maxage=86400, stale-while-revalidate=28800";

export const GET = async () => {
  try {
    const [data, flags] = await Promise.all([
      getCachedSyncMeta(),
      getCachedFeatureFlags(),
    ]);

    const payload = {
      ...data,
      public_feature_flags: evaluatePublicFlags(flags),
    };

    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": CACHE_CONTROL_HEADER,
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
};
