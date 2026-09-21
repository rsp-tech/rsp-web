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
