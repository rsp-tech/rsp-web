import type { NextRequest } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export const dynamic = "force-static";
export const revalidate = 31536000;

const VALID_FILENAME_REGEX = /^[a-zA-Z0-9_-]+\.(webp|avif|png|jpg|jpeg)$/i;

const getContentType = (filename: string, blobType?: string): string => {
  if (blobType && blobType !== "application/octet-stream") {
    return blobType;
  }
  const lower = filename.toLowerCase();
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".avif")) return "image/avif";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
};

export const GET = async (
  _request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
): Promise<Response> => {
  try {
    const { path } = await context.params;

    // Validate path: must be exactly one root-level filename with no directory segments
    if (path?.length !== 1) {
      console.error("[ImageProxy] Invalid path segments:", path);
      return new Response(null, { status: 400 });
    }

    const filename = path[0];
    if (!filename || !VALID_FILENAME_REGEX.test(filename)) {
      console.error("[ImageProxy] Invalid filename requested:", filename);
      return new Response(null, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.storage
      .from("images")
      .download(filename);

    if (error) {
      console.error(
        `[ImageProxy] Supabase storage download error for "${filename}":`,
        error,
      );
      return new Response(null, { status: 404 });
    }

    if (!data) {
      console.error(
        `[ImageProxy] Supabase storage returned empty data for "${filename}"`,
      );
      return new Response(null, { status: 404 });
    }

    const contentType = getContentType(filename, data.type);

    return new Response(data.stream(), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(data.size),
        "Cache-Control":
          "public, max-age=31536000, s-maxage=31536000, immutable",
        "CDN-Cache-Control": "public, max-age=31536000, immutable",
        "Vercel-CDN-Cache-Control":
          "public, max-age=31536000, s-maxage=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("[ImageProxy] Unexpected error serving image:", err);
    return new Response(null, { status: 500 });
  }
};
