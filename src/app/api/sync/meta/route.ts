import { NextResponse } from "next/server";
import { getCachedSyncMeta } from "../meta-service";

export const revalidate = 86400; // 24 hours

export const GET = async () => {
  try {
    const data = await getCachedSyncMeta();
    return NextResponse.json(data, {
      headers: {
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=86400",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 },
    );
  }
};
