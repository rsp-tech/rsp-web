import { NextResponse } from "next/server";
import { getCachedSyncMeta } from "../meta-service";

export const revalidate = 86400; // 24 hours

const CACHE_CONTROL_HEADER =
  "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400";

export const GET = async () => {
  try {
    const data = await getCachedSyncMeta();

    return new Response(JSON.stringify(data), {
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
