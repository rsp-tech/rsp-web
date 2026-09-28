import { revalidatePath, revalidateTag } from "next/cache";
import { type NextRequest, NextResponse } from "next/server";
import { API_PATH, CACHE_TAG } from "@/app/api/constants";
import { axiomLogger } from "@/lib/axiom-logger";
import { verifyRevalidateAuth } from "../auth";

export const POST = async (req: NextRequest) => {
  const authError = await verifyRevalidateAuth(req);
  if (authError) return authError;

  // Flush scheduled backup release zip and backup CSV tables
  revalidateTag(CACHE_TAG.BACKUP_RESOURCES, {});
  revalidatePath(API_PATH.SYNC);

  axiomLogger.info("[API /api/revalidate/backup] Flushed backup caches", {
    revalidatedTags: [CACHE_TAG.BACKUP_RESOURCES],
    revalidatedPaths: [API_PATH.SYNC],
  });

  return NextResponse.json({
    success: true,
    revalidatedTags: [CACHE_TAG.BACKUP_RESOURCES],
    revalidatedPaths: [API_PATH.SYNC],
  });
};
