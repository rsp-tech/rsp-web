import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { API_PATH, CACHE_TAG } from "@/app/api/constants";
import { verifyRevalidateAuth } from "./auth";

export const POST = async (req: NextRequest) => {
  const origin =
    req.headers.get("origin") || req.headers.get("host") || "unknown";

  const authError = await verifyRevalidateAuth(req);
  if (authError) {
    console.error(
      `[API /api/revalidate] Auth verification failed for request from: ${origin}`,
    );
    return authError;
  }

  // Flush live sync metadata
  revalidateTag(CACHE_TAG.SYNC_META, {});
  revalidateTag(CACHE_TAG.LIVE_DIFF, {});
  revalidatePath(API_PATH.SYNC_META);
  revalidatePath(API_PATH.SYNC);

  const body = (await req.json().catch(() => ({}))) as {
    paths?: string[];
    path?: string;
    tag?: string;
    tags?: string[];
  };

  const revalidated: string[] = [
    API_PATH.SYNC_META,
    API_PATH.SYNC,
    `tag:${CACHE_TAG.SYNC_META}`,
    `tag:${CACHE_TAG.LIVE_DIFF}`,
  ];

  const tags = body.tags ?? (body.tag ? [body.tag] : []);
  for (const tag of tags) {
    revalidateTag(tag, {});
    revalidated.push(`tag:${tag}`);
  }

  const paths = body.paths ?? (body.path ? [body.path] : []);

  for (const path of paths) {
    if (!path.startsWith("/")) {
      continue;
    }

    revalidatePath(path);
    revalidated.push(path);
  }

  console.log(
    `[API /api/revalidate] Flushed targets (${origin}):`,
    revalidated,
  );

  return NextResponse.json({
    success: true,
    revalidated,
  });
};
