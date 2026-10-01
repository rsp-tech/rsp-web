import { type NextRequest, NextResponse } from "next/server";
import { FEATURE_FLAGS } from "@/constants";
import { axiomLogger, withApiLogging } from "@/lib/axiom-logger";
import { isFeatureFlagEnabled } from "@/lib/feature-flags-service";
import { generateM2MToken } from "@/lib/jwt";

const MAX_USER_FILE_SIZE = 15 * 1024 * 1024; // 15MB limit for user uploads

const isAllowedAttachmentMimeType = (mimeType: string): boolean => {
  const normalized = mimeType.toLowerCase().trim();
  return normalized.startsWith("image/") || normalized === "application/pdf";
};

export const POST = withApiLogging(
  "/api/queries/upload-session",
  async (req: NextRequest) => {
    try {
      const body = await req.json();
      const { fileName, mimeType, fileSize, origin, userId } = body;

      const allowed = await isFeatureFlagEnabled(
        FEATURE_FLAGS.QUERY_FILE_UPLOADS,
        userId,
      );
      if (!allowed) {
        return NextResponse.json(
          { error: "File uploads are currently disabled" },
          { status: 403 },
        );
      }

      if (!mimeType) {
        return NextResponse.json(
          { error: "Missing mimeType parameter" },
          { status: 400 },
        );
      }

      if (!isAllowedAttachmentMimeType(mimeType)) {
        return NextResponse.json(
          {
            error:
              "Invalid mimeType: Only images and PDF documents are allowed as attachments",
          },
          { status: 400 },
        );
      }

      if (typeof fileSize === "number" && fileSize > MAX_USER_FILE_SIZE) {
        return NextResponse.json(
          {
            error: `File size exceeds the 15MB limit. Please choose a smaller file.`,
          },
          { status: 400 },
        );
      }

      const endpoint = process.env["UPLOAD_SERVICE_ENDPOINT"];
      if (!endpoint) {
        return NextResponse.json(
          { error: "UPLOAD_SERVICE_ENDPOINT is not configured on server" },
          { status: 500 },
        );
      }

      const token = await generateM2MToken();
      const url = `${endpoint.replace(/\/$/, "")}/api/files/query-attachment-session`;

      const clientOrigin = origin || req.headers.get("origin") || undefined;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fileName,
          mimeType,
          origin: clientOrigin,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        axiomLogger.error("Upload service error creating attachment session", {
          event: "upload.session_error",
          route: "/api/queries/upload-session",
          status: res.status,
          response: errText,
          file_name: fileName,
          mime_type: mimeType,
        });
        return NextResponse.json(
          { error: `Upload service error (${res.status}): ${errText}` },
          { status: res.status },
        );
      }

      const data = await res.json();
      return NextResponse.json(data);
    } catch (err: unknown) {
      console.error("Error creating query attachment upload session:", err);
      throw err;
    }
  },
);
