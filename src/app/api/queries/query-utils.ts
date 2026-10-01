import { NextResponse } from "next/server";
import { FEATURE_FLAGS, MAX_QUERY_ATTACHMENTS } from "@/constants";
import { isFeatureFlagEnabled } from "@/lib/feature-flags-service";
import type { QueryAttachment } from "@/types";

export const ALLOWED_ATTACHMENT_TYPES = new Set([
  "image",
  "pdf",
  "link",
  "recording",
  "category",
  "material",
]);

export const validateAttachments = (
  attachments?: unknown,
  maxAllowed = 5,
): string | null => {
  if (!attachments) return null;
  if (!Array.isArray(attachments)) {
    return "attachments must be an array";
  }
  if (attachments.length > maxAllowed) {
    return `Maximum ${maxAllowed} attachments allowed`;
  }
  for (const att of attachments) {
    if (
      !att ||
      typeof att !== "object" ||
      !ALLOWED_ATTACHMENT_TYPES.has(att.type)
    ) {
      return `Invalid attachment type: ${att?.type}`;
    }
  }
  return null;
};

export const validateQueryAttachments = async (
  attachments?: QueryAttachment[],
  userId?: string | null,
  maxAllowed = MAX_QUERY_ATTACHMENTS,
): Promise<NextResponse | null> => {
  const attachError = validateAttachments(attachments, maxAllowed);
  if (attachError) {
    return NextResponse.json({ error: attachError }, { status: 400 });
  }

  const hasFiles = (attachments ?? []).some(
    (a) => a.type === "image" || a.type === "pdf",
  );
  if (hasFiles) {
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
  }

  return null;
};
