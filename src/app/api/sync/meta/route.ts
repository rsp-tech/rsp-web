import { type NextRequest, NextResponse } from "next/server";
import { getCachedSyncMeta } from "../meta-service";

export const revalidate = 86400; // 24 hours

const CACHE_CONTROL_HEADER =
  "public, max-age=0, s-maxage=86400, stale-while-revalidate=86400";

export const GET = async (req: NextRequest) => {
  try {
    const data = await getCachedSyncMeta();

    // Fast, deterministic ETag based on table IDs and updated_at timestamps
    const rawTag = Object.entries(data)
      .map(([k, v]) => `${k}:${v}`)
      .join("|");
    const etag = `"${Buffer.from(rawTag).toString("base64")}"`;

    const clientEtag = req.headers.get("if-none-match");

    if (clientEtag && (clientEtag === etag || clientEtag === `W/${etag}`)) {
      return new Response(null, {
        status: 304,
        headers: {
          ETag: etag,
          "Cache-Control": CACHE_CONTROL_HEADER,
        },
      });
    }

    return NextResponse.json(data, {
      headers: {
        ETag: etag,
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
