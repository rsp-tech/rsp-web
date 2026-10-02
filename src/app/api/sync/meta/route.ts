import { NextResponse } from "next/server";
import { axiomLogger, withApiLogging } from "@/lib/axiom-logger";
import {
  evaluatePublicFlags,
  getCachedFeatureFlags,
} from "@/lib/feature-flags-service";
import { getCachedSyncMeta } from "../meta-service";

const CACHE_CONTROL_HEADER = "public, max-age=15, s-maxage=15";

export const GET = withApiLogging("/api/sync/meta", async () => {
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
    axiomLogger.error("Failed to fetch sync meta", {
      event: "sync.meta_error",
      route: "/api/sync/meta",
      error,
    });
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
});
