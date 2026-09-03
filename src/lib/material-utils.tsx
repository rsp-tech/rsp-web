import {
  BookOpen,
  ExternalLink,
  FileText,
  GraduationCap,
  Presentation,
} from "lucide-react";
import type { Material } from "@/types";

export const sanitizeFileName = (name: string): string => {
  return name.replace(/[/\\?%*:|"<>]/g, "_").trim();
};

export const isMaterialLink = (uri?: string | null): boolean => {
  if (!uri) return false;
  return /^https?:\/\//i.test(uri.trim());
};

export const getMaterialExtension = (mat: Material): string => {
  const uri = mat.uri || "";
  const match = uri.match(/\.([a-zA-Z0-9]+)(?:[?#]|$)/);
  if (match?.[1]) {
    return `.${match[1]}`;
  }
  const nameMatch = mat.name.match(/\.([a-zA-Z0-9]+)$/);
  if (nameMatch?.[1]) {
    return "";
  }
  if (mat.type === "pdf" || mat.name.toLowerCase().endsWith(".pdf")) {
    return ".pdf";
  }
  return "";
};

export const guessExtensionFromBytesAndMime = (
  data: Uint8Array,
  mimeType?: string,
  mat?: Material,
): string => {
  // 1. Check if name or uri already has a valid extension
  if (mat) {
    const existing = getMaterialExtension(mat);
    if (existing) return existing;
  }

  // 2. Magic Bytes Inspection
  if (data.length >= 4) {
    // PDF: %PDF (0x25 0x50 0x44 0x46)
    if (
      data[0] === 0x25 &&
      data[1] === 0x50 &&
      data[2] === 0x44 &&
      data[3] === 0x46
    ) {
      return ".pdf";
    }

    // JPEG: 0xFF 0xD8 0xFF
    if (data[0] === 0xff && data[1] === 0xd8 && data[2] === 0xff) {
      return ".jpg";
    }

    // PNG: 0x89 0x50 0x4E 0x47 (\x89PNG)
    if (
      data[0] === 0x89 &&
      data[1] === 0x50 &&
      data[2] === 0x4e &&
      data[3] === 0x47
    ) {
      return ".png";
    }

    // MP3: ID3
    if (data[0] === 0x49 && data[1] === 0x44 && data[2] === 0x33) {
      return ".mp3";
    }

    // ZIP / OpenXML Office / EPUB: PK\x03\x04 (0x50 0x4B 0x03 0x04)
    if (
      data[0] === 0x50 &&
      data[1] === 0x4b &&
      data[2] === 0x03 &&
      data[3] === 0x04
    ) {
      const headerSnippet = new TextDecoder("utf-8", { fatal: false }).decode(
        data.subarray(0, Math.min(data.length, 2048)),
      );
      if (headerSnippet.includes("word/")) return ".docx";
      if (headerSnippet.includes("ppt/")) return ".pptx";
      if (headerSnippet.includes("xl/")) return ".xlsx";
      if (headerSnippet.includes("epub") || headerSnippet.includes("META-INF"))
        return ".epub";
      return ".zip";
    }
  }

  // 3. MIME Type Matching
  if (mimeType) {
    const cleanMime = mimeType.split(";")[0]?.trim().toLowerCase();
    switch (cleanMime) {
      case "application/pdf":
        return ".pdf";
      case "application/vnd.openxmlformats-officedocument.presentationml.presentation":
        return ".pptx";
      case "application/vnd.ms-powerpoint":
        return ".ppt";
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return ".docx";
      case "application/msword":
        return ".doc";
      case "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
        return ".xlsx";
      case "application/vnd.ms-excel":
        return ".xls";
      case "application/epub+zip":
        return ".epub";
      case "text/plain":
        return ".txt";
      case "text/html":
        return ".html";
      case "text/csv":
        return ".csv";
      case "image/jpeg":
        return ".jpg";
      case "image/png":
        return ".png";
      case "image/webp":
        return ".webp";
      case "audio/mpeg":
        return ".mp3";
      case "audio/mp4":
      case "audio/m4a":
        return ".m4a";
      case "application/zip":
        return ".zip";
    }
  }

  // 4. Fallback to material type metadata if present
  if (mat?.type) {
    const cleanType = mat.type.trim().toLowerCase().replace(/^\./, "");
    if (cleanType) return `.${cleanType}`;
  }

  return "";
};

export const resolveMaterialFileName = (
  mat: Material,
  fileResult?: { data: Uint8Array; mimeType: string },
): string => {
  const safeName = sanitizeFileName(mat.name);
  const existingExt = getMaterialExtension(mat);
  if (existingExt) {
    if (safeName.toLowerCase().endsWith(existingExt.toLowerCase())) {
      return safeName;
    }
    return `${safeName}${existingExt}`;
  }

  if (fileResult) {
    const guessedExt = guessExtensionFromBytesAndMime(
      fileResult.data,
      fileResult.mimeType,
      mat,
    );
    if (guessedExt) {
      if (safeName.toLowerCase().endsWith(guessedExt.toLowerCase())) {
        return safeName;
      }
      return `${safeName}${guessedExt}`;
    }
  }

  if (mat.type) {
    const cleanType = mat.type.trim().toLowerCase().replace(/^\./, "");
    if (cleanType && !safeName.toLowerCase().endsWith(`.${cleanType}`)) {
      return `${safeName}.${cleanType}`;
    }
  }

  return safeName;
};

export const getMaterialIcon = (mat: Material) => {
  const isLink = isMaterialLink(mat.uri);
  const lowerName = mat.name.toLowerCase();

  if (isLink) {
    return <ExternalLink className="w-3 h-3 text-muted-foreground shrink-0" />;
  }
  if (lowerName.includes("teacher")) {
    return <GraduationCap className="w-3 h-3 text-success shrink-0" />;
  }
  if (lowerName.includes("student") || lowerName.includes("handout")) {
    return <BookOpen className="w-3 h-3 text-primary shrink-0" />;
  }
  if (lowerName.includes("ppt")) {
    return <Presentation className="w-3 h-3 text-primary shrink-0" />;
  }
  return <FileText className="w-3 h-3 text-muted-foreground shrink-0" />;
};
