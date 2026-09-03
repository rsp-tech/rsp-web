import { describe, expect, it, vi } from "vitest";

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({
    invalidateQueries: vi.fn(),
  }),
}));

vi.mock("@/lib/audio-idb-ledger", () => ({
  touchTrackMeta: vi.fn(),
  enforceLRUWatermark: vi.fn(),
}));

(globalThis as any).caches = {
  open: () =>
    Promise.resolve({
      match: () => Promise.resolve(null),
      put: () => Promise.resolve(),
      delete: () => Promise.resolve(true),
    }),
};

import {
  buildZipHierarchy,
  type FetchedFileResult,
  getMaterialExtension,
  guessExtensionFromBytesAndMime,
  isMaterialLink,
  prepareDistinctTasks,
  resolveMaterialFileName,
  sanitizeFileName,
  useBatchDownloader,
} from "./use-batch-downloader";

describe.concurrent("use-batch-downloader hook suite", () => {
  it.concurrent("exports useBatchDownloader function", () => {
    expect(typeof useBatchDownloader).toBe("function");
  });

  it.concurrent("sanitizeFileName strips illegal characters", () => {
    expect(sanitizeFileName('Lesson / 1: "Intro"? *')).toBe(
      "Lesson _ 1_ _Intro__ _",
    );
  });

  it.concurrent("isMaterialLink detects http/https links", () => {
    expect(isMaterialLink("https://drive.google.com/link")).toBe(true);
    expect(isMaterialLink("http://example.com")).toBe(true);
    expect(isMaterialLink("gdrive_file_id_12345")).toBe(false);
    expect(isMaterialLink(null)).toBe(false);
  });

  it.concurrent("getMaterialExtension resolves extensions accurately", () => {
    expect(
      getMaterialExtension({ id: 1, name: "Slide", uri: "file.pptx" } as any),
    ).toBe(".pptx");
    expect(
      getMaterialExtension({
        id: 2,
        name: "Document",
        uri: "file",
        type: "pdf",
      } as any),
    ).toBe(".pdf");
  });

  it.concurrent("guessExtensionFromBytesAndMime guesses extension accurately", () => {
    // PDF magic bytes: %PDF
    const pdfBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31]);
    expect(guessExtensionFromBytesAndMime(pdfBytes)).toBe(".pdf");

    // PNG magic bytes
    const pngBytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]);
    expect(guessExtensionFromBytesAndMime(pngBytes)).toBe(".png");

    // JPEG magic bytes
    const jpgBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]);
    expect(guessExtensionFromBytesAndMime(jpgBytes)).toBe(".jpg");

    // OpenXML PPTX zip header containing ppt/
    const pptxBytes = new TextEncoder().encode(
      "PK\x03\x04...[Content_Types].xml...ppt/presentation.xml",
    );
    expect(guessExtensionFromBytesAndMime(pptxBytes)).toBe(".pptx");

    // MIME type fallback
    const dummyBytes = new Uint8Array([0, 0, 0, 0]);
    expect(guessExtensionFromBytesAndMime(dummyBytes, "application/pdf")).toBe(
      ".pdf",
    );
    expect(
      guessExtensionFromBytesAndMime(
        dummyBytes,
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toBe(".docx");
  });

  it.concurrent("resolveMaterialFileName appends guessed extension when missing", () => {
    const mat = {
      id: 1,
      name: "Handout Summary",
      uri: "drive_file_id_123",
    } as any;
    const fileRes: FetchedFileResult = {
      key: "mat:drive_file_id_123",
      data: new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d]),
      mimeType: "application/pdf",
    };

    expect(resolveMaterialFileName(mat, fileRes)).toBe("Handout Summary.pdf");
  });

  it.concurrent("prepareDistinctTasks deduplicates tasks and excludes external links", () => {
    const recordings = [
      {
        id: 1,
        name: "Lecture 1",
        audio_id: "aud_1",
        materials: [
          { id: 10, name: "Shared Slokas", uri: "slokas_gdrive_id" },
          { id: 11, name: "Web Resource", uri: "https://example.com/slokas" },
        ],
      },
      {
        id: 2,
        name: "Lecture 2",
        audio_id: "aud_2",
        materials: [
          { id: 12, name: "Shared Slokas", uri: "slokas_gdrive_id" }, // Duplicate URI
        ],
      },
    ];

    const tasks = prepareDistinctTasks(
      recordings as any[],
      new Set(["aud_1", "aud_2"]),
      new Set([10, 11, 12]),
    );

    expect(tasks.length).toBe(3);
    expect(tasks.map((t) => t.key)).toEqual([
      "audio:aud_1",
      "mat:slokas_gdrive_id",
      "audio:aud_2",
    ]);
  });

  it.concurrent("buildZipHierarchy places audio at root for audio-only recordings", () => {
    const recordings = [
      { id: 1, name: "Lecture 1", audio_id: "aud_1", materials: [] },
      { id: 2, name: "Lecture 2", audio_id: "aud_2", materials: [] },
    ];

    const fileResultMap = new Map<string, FetchedFileResult>();
    fileResultMap.set("audio:aud_1", {
      key: "audio:aud_1",
      data: new Uint8Array([1, 2, 3]),
      mimeType: "audio/mpeg",
    });
    fileResultMap.set("audio:aud_2", {
      key: "audio:aud_2",
      data: new Uint8Array([4, 5, 6]),
      mimeType: "audio/mpeg",
    });

    const zipData = buildZipHierarchy({
      recordings: recordings as any[],
      selectedAudioIds: new Set(["aud_1", "aud_2"]),
      selectedMaterialIds: new Set(),
      fileResultMap,
    });

    expect(Object.keys(zipData)).toEqual(["Lecture 1.mp3", "Lecture 2.mp3"]);
  });

  it.concurrent("buildZipHierarchy organizes mixed folders, shared-materials with guessed extensions, and reference-materials.md", () => {
    const recordings = [
      {
        id: 1,
        name: "Lecture 1",
        audio_id: "aud_1",
        materials: [
          { id: 10, name: "Exclusive Handout", uri: "notes_1_raw_id" }, // No extension in name/uri
          { id: 20, name: "Shared Prayers", uri: "shared_prayers_raw_id" }, // No extension in name/uri
          {
            id: 30,
            name: "Online Audio Stream",
            uri: "https://vedabase.io/verse",
          },
        ],
      },
      {
        id: 2,
        name: "Lecture 2",
        audio_id: "aud_2",
        materials: [
          { id: 21, name: "Shared Prayers", uri: "shared_prayers_raw_id" },
        ],
      },
      {
        id: 3,
        name: "Lecture 3",
        audio_id: "aud_3",
        materials: [],
      },
    ];

    const fileResultMap = new Map<string, FetchedFileResult>();
    fileResultMap.set("audio:aud_1", {
      key: "audio:aud_1",
      data: new Uint8Array([1]),
      mimeType: "audio/mpeg",
    });
    fileResultMap.set("audio:aud_2", {
      key: "audio:aud_2",
      data: new Uint8Array([2]),
      mimeType: "audio/mpeg",
    });
    fileResultMap.set("audio:aud_3", {
      key: "audio:aud_3",
      data: new Uint8Array([3]),
      mimeType: "audio/mpeg",
    });
    fileResultMap.set("mat:notes_1_raw_id", {
      key: "mat:notes_1_raw_id",
      data: new Uint8Array([0x25, 0x50, 0x44, 0x46]), // %PDF
      mimeType: "application/pdf",
    });
    fileResultMap.set("mat:shared_prayers_raw_id", {
      key: "mat:shared_prayers_raw_id",
      data: new Uint8Array([0x25, 0x50, 0x44, 0x46]), // %PDF
      mimeType: "application/pdf",
    });

    const zipData = buildZipHierarchy({
      recordings: recordings as any[],
      selectedAudioIds: new Set(["aud_1", "aud_2", "aud_3"]),
      selectedMaterialIds: new Set([10, 20, 21, 30]),
      fileResultMap,
    });

    const zipKeys = Object.keys(zipData);

    // Shared materials in shared-materials/ folder with guessed .pdf extension
    expect(zipKeys).toContain("shared-materials/Shared Prayers.pdf");

    // Audio-only recording 3 is at root
    expect(zipKeys).toContain("Lecture 3.mp3");

    // Recording 1 has folder with audio, exclusive material (.pdf guessed), and reference-materials.md
    expect(zipKeys).toContain("Lecture 1/Lecture 1.mp3");
    expect(zipKeys).toContain("Lecture 1/Exclusive Handout.pdf");
    expect(zipKeys).toContain("Lecture 1/reference-materials.md");

    // Recording 2 has folder with audio and reference-materials.md
    expect(zipKeys).toContain("Lecture 2/Lecture 2.mp3");
    expect(zipKeys).toContain("Lecture 2/reference-materials.md");

    // Check contents of reference-materials.md for Recording 1
    const rec1MdBytes = zipData[
      "Lecture 1/reference-materials.md"
    ] as Uint8Array;
    const rec1MdText = new TextDecoder().decode(rec1MdBytes);
    expect(rec1MdText).toContain("# Reference Materials for Lecture 1");
    expect(rec1MdText).toContain(
      "[Shared Prayers](../shared-materials/Shared Prayers.pdf)",
    );
    expect(rec1MdText).toContain(
      "[Online Audio Stream](https://vedabase.io/verse)",
    );
  });
});
