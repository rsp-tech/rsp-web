import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase-server";

const getContentType = (pathname: string, blobType?: string): string => {
  if (blobType && blobType !== "application/octet-stream") {
    return blobType;
  }
  const lower = pathname.toLowerCase();
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".avif")) return "image/avif";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".svg")) return "image/svg+xml";
  return "application/octet-stream";
};

export const GET = async (
  _request: NextRequest,
  context: { params: Promise<{ path?: string[] }> },
): Promise<Response> => {
  try {
    const { path } = await context.params;
    if (!path || path.length === 0) {
      return NextResponse.json(
        { error: "Image path required" },
        { status: 400 },
      );
    }

    const storagePath = path.join("/");
    const supabase = getSupabaseServerClient();
    const { data, error } = await supabase.storage
      .from("images")
      .download(storagePath);

    if (error || !data) {
      return NextResponse.json(
        { error: "Image not found" },
        { status: 404 },
      );
    }

    const arrayBuffer = await data.arrayBuffer();
    const contentType = getContentType(storagePath, data.type);

    return new Response(arrayBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(arrayBuffer.byteLength),
        "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
        "CDN-Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (err) {
    console.error("Error serving image:", err);
    return NextResponse.json(
      { error: "Failed to load image" },
      { status: 500 },
    );
  }
};
