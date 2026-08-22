import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { API_PATH, CACHE_TAG } from "@/app/api/constants";
import { verifyRevalidateAuth } from "./auth";

export const POST = async (req: NextRequest) => {
  const authError = await verifyRevalidateAuth(req);
  if (authError) return authError;

  // Flush live sync metadata
  revalidateTag(CACHE_TAG.SYNC_META, {});
  revalidatePath(API_PATH.SYNC_META);

  const body = (await req.json().catch(() => ({}))) as {
    paths?: string[];
    path?: string;
  };

  const paths = body.paths ?? (body.path ? [body.path] : []);
  const revalidated: string[] = [API_PATH.SYNC_META];

  for (const path of paths) {
    if (!path.startsWith("/")) {
      continue;
    }

    revalidatePath(path);
    revalidated.push(path);
  }

  return NextResponse.json({
    success: true,
    revalidated,
  });
};
