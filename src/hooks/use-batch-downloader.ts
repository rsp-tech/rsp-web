"use client";

import { useQueryClient } from "@tanstack/react-query";
import { type AsyncZippable, zip } from "fflate";
import { useCallback, useRef, useState } from "react";
import {
  AUDIO_CACHE_NAME,
  MATERIALS_CACHE_NAME,
  QUERY_KEY,
  STREAM_LIMIT_BYTES,
} from "@/constants";
import { getAudioCacheSettings } from "@/hooks/use-audio-cache";
import { enforceLRUWatermark, touchTrackMeta } from "@/lib/audio-idb-ledger";
import {
  extractGoogleDriveConfirmUrl,
  getMaterialExtension,
  guessExtensionFromBytesAndMime,
  isGoogleDriveVirusWarning,
  isMaterialLink,
  resolveMaterialFileName,
  sanitizeFileName,
} from "@/lib/material-utils";
import { getAssetUrl, getAudioUrl } from "@/lib/storage";
import { parseSize } from "@/lib/utils";
import type { EnrichedRecording, Material } from "@/types";

export {
  extractGoogleDriveConfirmUrl,
  getMaterialExtension,
  guessExtensionFromBytesAndMime,
  isGoogleDriveVirusWarning,
  isMaterialLink,
  resolveMaterialFileName,
  sanitizeFileName,
};

export interface BatchDownloadProgress {
  completed: number;
  total: number;
  percent: number;
  currentName: string;
}

export interface SkippedDownloadItem {
  name: string;
  uri?: string;
  type: "audio" | "material";
  reason: string;
}

export interface UseBatchDownloaderReturn {
  isProcessing: boolean;
  status: "idle" | "downloading" | "zipping" | "completed" | "error";
  progress: BatchDownloadProgress;
  errorMessage: string | null;
  skippedItems: SkippedDownloadItem[];
  startZipDownload: (options: {
    recordings: EnrichedRecording[];
    selectedAudioIds: Set<string>;
    selectedMaterialIds: Set<number>;
    zipFileName?: string;
    shouldCache?: boolean;
  }) => Promise<void>;
  startCacheOnly: (options: {
    recordings: EnrichedRecording[];
    selectedAudioIds: Set<string>;
    selectedMaterialIds: Set<number>;
  }) => Promise<void>;
  cancel: () => void;
  reset: () => void;
}

export interface FetchTask {
  key: string;
  type: "audio" | "material";
  name: string;
  url: string;
  cacheKey: string;
  cacheName: string;
  recId?: number;
  material?: Material;
  downloadFileName: string;
  size?: number | null;
}

export interface FetchedFileResult {
  key: string;
  data: Uint8Array;
  mimeType: string;
  skipped?: boolean;
  skippedItem?: SkippedDownloadItem;
}

const CONCURRENCY_LIMIT = 3;

const createSkippedLargeFileResult = (
  task: FetchTask,
  reason = "File is too large for automated scanning (>100MB). Requires direct download.",
): FetchedFileResult => ({
  key: task.key,
  data: new Uint8Array(),
  mimeType: "text/html",
  skipped: true,
  skippedItem: {
    name: task.name,
    uri: task.material?.uri || String(task.cacheKey),
    type: task.type,
    reason,
  },
});

const fetchItemData = async (
  task: FetchTask,
  signal: AbortSignal,
  shouldCache = true,
): Promise<FetchedFileResult> => {
  if (parseSize(task.size) > STREAM_LIMIT_BYTES) {
    return createSkippedLargeFileResult(task);
  }

  let blob: Blob | null = null;
  let mimeType = "";

  if (typeof window !== "undefined" && "caches" in window) {
    try {
      const cache = await caches.open(task.cacheName);
      const cachedRes = await cache.match(task.cacheKey);
      if (cachedRes) {
        mimeType = cachedRes.headers.get("content-type") || "";
        blob = await cachedRes.blob();
      }
    } catch (err) {
      console.warn("Failed to check CacheStorage for", task.name, err);
    }
  }

  if (!blob) {
    const res = await fetch(task.url, { signal });
    if (!res.ok) {
      throw new Error(
        `Failed to fetch ${task.name} (${res.status} ${res.statusText})`,
      );
    }
    mimeType = res.headers.get("content-type") || "";
    blob = await res.blob();

    // Check if Google Drive returned a virus scan warning HTML page instead of binary
    if (
      mimeType.includes("text/html") ||
      blob.type.includes("text/html") ||
      blob.size < 50000
    ) {
      const sampleBuffer = await blob.slice(0, 4096).arrayBuffer();
      const sampleText = new TextDecoder("utf-8", { fatal: false }).decode(
        sampleBuffer,
      );

      if (isGoogleDriveVirusWarning(sampleText)) {
        const fullHtml = await blob.text();
        const confirmUrl = extractGoogleDriveConfirmUrl(fullHtml);

        if (confirmUrl) {
          try {
            const confirmRes = await fetch(confirmUrl, { signal });
            if (confirmRes.ok) {
              const confirmBlob = await confirmRes.blob();
              const confirmSample = await confirmBlob
                .slice(0, 4096)
                .arrayBuffer();
              const confirmText = new TextDecoder("utf-8", {
                fatal: false,
              }).decode(confirmSample);

              if (!isGoogleDriveVirusWarning(confirmText)) {
                blob = confirmBlob;
                mimeType =
                  confirmRes.headers.get("content-type") || confirmBlob.type;
              }
            }
          } catch (retryErr) {
            console.warn(
              "Failed automatic confirm retry for Google Drive large file:",
              retryErr,
            );
          }
        }

        // If it's STILL the HTML virus warning page, skip binary bundling gracefully
        const finalSample = await blob.slice(0, 4096).arrayBuffer();
        const finalText = new TextDecoder("utf-8", { fatal: false }).decode(
          finalSample,
        );
        if (isGoogleDriveVirusWarning(finalText)) {
          return createSkippedLargeFileResult(task);
        }
      }
    }

    if (shouldCache && typeof window !== "undefined" && "caches" in window) {
      try {
        const settings = getAudioCacheSettings();
        const canCache =
          task.type === "audio" || settings.enableMaterialsCache !== false;

        if (canCache) {
          const cache = await caches.open(task.cacheName);
          const responseToCache = new Response(blob, {
            headers: { "content-type": mimeType || blob.type },
          });
          await cache.put(task.cacheKey, responseToCache);

          if (task.type === "audio" && task.recId) {
            await touchTrackMeta(String(task.cacheKey), task.recId, blob.size);
          }
        }
      } catch (err) {
        console.warn("Failed to write to cache for", task.name, err);
      }
    }
  }

  if (!mimeType && blob.type) {
    mimeType = blob.type;
  }

  const arrayBuffer = await blob.arrayBuffer();
  return {
    key: task.key,
    data: new Uint8Array(arrayBuffer),
    mimeType,
  };
};

export const prepareDistinctTasks = (
  recordings: EnrichedRecording[],
  selectedAudioIds: Set<string>,
  selectedMaterialIds: Set<number>,
): FetchTask[] => {
  const taskMap = new Map<string, FetchTask>();

  for (const rec of recordings) {
    if (rec.audio_id && selectedAudioIds.has(rec.audio_id)) {
      const key = `audio:${rec.audio_id}`;
      if (!taskMap.has(key)) {
        const safeName = sanitizeFileName(rec.name);
        taskMap.set(key, {
          key,
          type: "audio",
          name: rec.name,
          url: getAudioUrl(rec.audio_id),
          cacheKey: rec.audio_id,
          cacheName: AUDIO_CACHE_NAME,
          recId: rec.id,
          size: rec.size,
          downloadFileName: `${safeName}.mp3`,
        });
      }
    }

    for (const mat of rec.materials ?? []) {
      if (
        selectedMaterialIds.has(mat.id) &&
        mat.uri &&
        !isMaterialLink(mat.uri)
      ) {
        const key = `mat:${mat.uri.trim()}`;
        if (!taskMap.has(key)) {
          const safeMatName = sanitizeFileName(mat.name);
          const ext = getMaterialExtension(mat);
          taskMap.set(key, {
            key,
            type: "material",
            name: mat.name,
            // Route through Cloudflare proxy for CORS support
            url: getAudioUrl(mat.uri),
            cacheKey: mat.uri,
            cacheName: MATERIALS_CACHE_NAME,
            material: mat,
            size: mat.size,
            downloadFileName: `${safeMatName}${ext}`,
          });
        }
      }
    }
  }

  return Array.from(taskMap.values());
};

// Backwards-compatible alias
export const prepareTasks = prepareDistinctTasks;

export const buildZipHierarchy = ({
  recordings,
  selectedAudioIds,
  selectedMaterialIds,
  fileResultMap,
}: {
  recordings: EnrichedRecording[];
  selectedAudioIds: Set<string>;
  selectedMaterialIds: Set<number>;
  fileResultMap: Map<string, FetchedFileResult>;
}): AsyncZippable => {
  const zipData: AsyncZippable = {};

  // 1. Calculate reference counts for downloadable materials among selected recordings
  const matRefCount = new Map<string, number>();
  const matSampleMap = new Map<string, Material>();

  for (const rec of recordings) {
    for (const mat of rec.materials ?? []) {
      if (
        selectedMaterialIds.has(mat.id) &&
        mat.uri &&
        !isMaterialLink(mat.uri)
      ) {
        const uri = mat.uri.trim();
        const fileRes = fileResultMap.get(`mat:${uri}`);
        // Only count if not skipped
        if (fileRes && !fileRes.skipped) {
          matRefCount.set(uri, (matRefCount.get(uri) || 0) + 1);
          if (!matSampleMap.has(uri)) {
            matSampleMap.set(uri, mat);
          }
        }
      }
    }
  }

  const isShared = (uri: string) => (matRefCount.get(uri) || 0) > 1;

  // 2. Add shared materials into shared-materials/ directory (only if shared materials exist)
  for (const [uri, count] of matRefCount.entries()) {
    if (count > 1) {
      const mat = matSampleMap.get(uri);
      if (mat) {
        const fileRes = fileResultMap.get(`mat:${uri}`);
        if (fileRes && !fileRes.skipped && fileRes.data.length > 0) {
          const resolvedFileName = resolveMaterialFileName(mat, fileRes);
          const sharedPath = `shared-materials/${resolvedFileName}`;
          zipData[sharedPath] = fileRes.data;
        }
      }
    }
  }

  // 3. Process each recording
  for (const rec of recordings) {
    const hasAudioSelected = Boolean(
      rec.audio_id && selectedAudioIds.has(rec.audio_id),
    );
    const audioRes = rec.audio_id
      ? fileResultMap.get(`audio:${rec.audio_id}`)
      : null;
    const isAudioValid = Boolean(
      hasAudioSelected &&
        audioRes &&
        !audioRes.skipped &&
        audioRes.data.length > 0,
    );

    const recMats = (rec.materials ?? []).filter((m) =>
      selectedMaterialIds.has(m.id),
    );
    const downloadableMats = recMats.filter(
      (m) => m.uri && !isMaterialLink(m.uri),
    );
    const linkMats = recMats.filter((m) => isMaterialLink(m.uri));

    const validDownloadableMats = downloadableMats.filter((m) => {
      const res = fileResultMap.get(`mat:${m.uri?.trim()}`);
      return res && !res.skipped && res.data.length > 0;
    });

    const skippedMats = downloadableMats.filter((m) => {
      const res = fileResultMap.get(`mat:${m.uri?.trim()}`);
      return res?.skipped;
    });

    const exclusiveMats = validDownloadableMats.filter((m) =>
      Boolean(m.uri && !isShared(m.uri)),
    );
    const sharedMatsForRec = validDownloadableMats.filter((m) =>
      Boolean(m.uri && isShared(m.uri)),
    );

    const safeRecName = sanitizeFileName(rec.name);
    const hasAnyMatsForRec = recMats.length > 0;

    // Rule: If only audio is selected for a recording -> add it to the zip root
    if (isAudioValid && !hasAnyMatsForRec && audioRes?.data) {
      zipData[`${safeRecName}.mp3`] = audioRes.data;
    } else if (isAudioValid || hasAnyMatsForRec) {
      const folder = safeRecName;

      if (isAudioValid && audioRes?.data) {
        zipData[`${folder}/${safeRecName}.mp3`] = audioRes.data;
      }

      // Add exclusive materials to recording folder with resolved extension
      for (const mat of exclusiveMats) {
        const fileRes = fileResultMap.get(`mat:${mat.uri?.trim()}`);
        if (fileRes && !fileRes.skipped && fileRes.data.length > 0) {
          const resolvedFileName = resolveMaterialFileName(mat, fileRes);
          zipData[`${folder}/${resolvedFileName}`] = fileRes.data;
        }
      }

      // Generate reference-materials.md if this recording has shared materials, links, or skipped large files
      if (
        sharedMatsForRec.length > 0 ||
        linkMats.length > 0 ||
        skippedMats.length > 0
      ) {
        let md = `# Reference Materials for ${rec.name}\n\n`;

        if (skippedMats.length > 0) {
          md += `## Large Study Materials (Direct Download)\n`;
          md += `*These files are too large (>100MB) for automated packaging. Please download them directly:*\n`;
          for (const skm of skippedMats) {
            if (skm.uri) {
              md += `- [${skm.name}](${getAssetUrl(skm.uri)})\n`;
            }
          }
          md += `\n`;
        }

        if (sharedMatsForRec.length > 0) {
          md += `## Shared Study Materials\n`;
          for (const sm of sharedMatsForRec) {
            const fileRes = fileResultMap.get(`mat:${sm.uri?.trim()}`);
            const resolvedFileName = resolveMaterialFileName(sm, fileRes);
            md += `- [${sm.name}](../shared-materials/${resolvedFileName})\n`;
          }
          md += `\n`;
        }

        if (linkMats.length > 0) {
          md += `## Online Resources & External Links\n`;
          for (const lm of linkMats) {
            md += `- [${lm.name}](${lm.uri})\n`;
          }
          md += `\n`;
        }

        const encodedMd = new TextEncoder().encode(md);
        zipData[`${folder}/reference-materials.md`] = encodedMd;
      }
    }
  }

  return zipData;
};

const executeQueue = async (
  tasks: FetchTask[],
  signal: AbortSignal,
  onProgress: (completed: number, currentName: string) => void,
  shouldCache = true,
): Promise<{
  fileResultMap: Map<string, FetchedFileResult>;
  skippedList: SkippedDownloadItem[];
}> => {
  const resultsMap = new Map<string, FetchedFileResult>();
  const skippedList: SkippedDownloadItem[] = [];
  let completedCount = 0;
  let nextIndex = 0;

  const worker = async (): Promise<void> => {
    while (nextIndex < tasks.length) {
      if (signal.aborted) throw new Error("Download aborted");

      const currentIndex = nextIndex;
      nextIndex += 1;
      const task = tasks[currentIndex];
      if (!task) break;

      onProgress(completedCount, task.name);

      const result = await fetchItemData(task, signal, shouldCache);
      resultsMap.set(result.key, result);
      if (result.skipped && result.skippedItem) {
        skippedList.push(result.skippedItem);
      }

      completedCount += 1;
      onProgress(completedCount, task.name);
    }
  };

  const workers = Array.from(
    { length: Math.min(CONCURRENCY_LIMIT, tasks.length) },
    () => worker(),
  );

  await Promise.all(workers);
  return { fileResultMap: resultsMap, skippedList };
};

export const useBatchDownloader = (): UseBatchDownloaderReturn => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "downloading" | "zipping" | "completed" | "error"
  >("idle");
  const [progress, setProgress] = useState<BatchDownloadProgress>({
    completed: 0,
    total: 0,
    percent: 0,
    currentName: "",
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [skippedItems, setSkippedItems] = useState<SkippedDownloadItem[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const reset = useCallback(() => {
    setIsProcessing(false);
    setStatus("idle");
    setProgress({ completed: 0, total: 0, percent: 0, currentName: "" });
    setErrorMessage(null);
    setSkippedItems([]);
  }, []);

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    reset();
  }, [reset]);

  const initSession = useCallback((tasks: FetchTask[]): AbortController => {
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setIsProcessing(true);
    setStatus("downloading");
    setErrorMessage(null);
    setSkippedItems([]);
    setProgress({
      completed: 0,
      total: tasks.length,
      percent: 0,
      currentName: tasks[0]?.name ?? "",
    });

    return controller;
  }, []);

  const finalizeSession = useCallback(
    async (completionName: string) => {
      await enforceLRUWatermark();
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.AUDIO_CACHE_LIST],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEY.MATERIALS_CACHE_LIST],
      });

      setStatus("completed");
      setProgress((prev) => ({
        ...prev,
        percent: 100,
        currentName: completionName,
      }));
    },
    [queryClient],
  );

  const handleSessionError = useCallback(
    (controller: AbortController, err: unknown, fallbackMessage: string) => {
      if (controller.signal.aborted) return;
      const msg = err instanceof Error ? err.message : fallbackMessage;
      setErrorMessage(msg);
      setStatus("error");
    },
    [],
  );

  const startZipDownload = useCallback(
    async ({
      recordings,
      selectedAudioIds,
      selectedMaterialIds,
      zipFileName = "Discourses_and_Materials.zip",
      shouldCache = true,
    }: {
      recordings: EnrichedRecording[];
      selectedAudioIds: Set<string>;
      selectedMaterialIds: Set<number>;
      zipFileName?: string;
      shouldCache?: boolean;
    }) => {
      const tasks = prepareDistinctTasks(
        recordings,
        selectedAudioIds,
        selectedMaterialIds,
      );
      if (tasks.length === 0) return;

      const controller = initSession(tasks);

      try {
        const { fileResultMap, skippedList } = await executeQueue(
          tasks,
          controller.signal,
          (completed, currentName) => {
            setProgress({
              completed,
              total: tasks.length,
              percent: Math.round((completed / tasks.length) * 90),
              currentName,
            });
          },
          shouldCache,
        );

        if (controller.signal.aborted) return;
        setSkippedItems(skippedList);

        // SINGLE FILE DIRECT DOWNLOAD
        if (tasks.length === 1 && tasks[0]) {
          const singleTask = tasks[0];
          const fileRes = fileResultMap.get(singleTask.key);

          if (fileRes?.skipped) {
            // Open direct download URL in a new tab
            const targetUri = singleTask.material?.uri || singleTask.cacheKey;
            window.open(
              getAssetUrl(targetUri),
              "_blank",
              "noopener,noreferrer",
            );
            await finalizeSession("Opened direct download link!");
            return;
          }

          if (fileRes?.data && fileRes.data.length > 0) {
            let finalFileName = singleTask.downloadFileName;
            let mimeType =
              fileRes.mimeType ||
              (singleTask.type === "audio"
                ? "audio/mpeg"
                : "application/octet-stream");

            if (singleTask.type === "material" && singleTask.material) {
              finalFileName = resolveMaterialFileName(
                singleTask.material,
                fileRes,
              );
              if (finalFileName.endsWith(".pdf") && !fileRes.mimeType) {
                mimeType = "application/pdf";
              }
            }

            const singleBlob = new Blob([fileRes.data.buffer as ArrayBuffer], {
              type: mimeType,
            });
            const downloadUrl = URL.createObjectURL(singleBlob);
            const link = document.createElement("a");
            link.href = downloadUrl;
            link.download = finalFileName;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
          }

          await finalizeSession("Download completed successfully!");
          return;
        }

        // MULTI-FILE ZIP DOWNLOAD
        const validEntries = Array.from(fileResultMap.values()).filter(
          (r) => !r.skipped && r.data.length > 0,
        );

        if (validEntries.length > 0) {
          setStatus("zipping");
          setProgress((prev) => ({
            ...prev,
            percent: 92,
            currentName: "Compressing into ZIP...",
          }));

          const zipData = buildZipHierarchy({
            recordings,
            selectedAudioIds,
            selectedMaterialIds,
            fileResultMap,
          });

          const zippedBlob = await new Promise<Blob>((resolve, reject) => {
            zip(zipData, { level: 0 }, (err, data) => {
              if (err) return reject(err);
              resolve(
                new Blob([data.buffer as ArrayBuffer], {
                  type: "application/zip",
                }),
              );
            });
          });

          if (controller.signal.aborted) return;

          // Trigger browser file download
          const downloadUrl = URL.createObjectURL(zippedBlob);
          const link = document.createElement("a");
          link.href = downloadUrl;
          link.download = zipFileName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          setTimeout(() => URL.revokeObjectURL(downloadUrl), 5000);
        }

        await finalizeSession(
          skippedList.length > 0
            ? "Download finished with some large files skipped"
            : "Download completed successfully!",
        );
      } catch (err: unknown) {
        handleSessionError(controller, err, "Download failed");
      } finally {
        setIsProcessing(false);
        abortControllerRef.current = null;
      }
    },
    [initSession, finalizeSession, handleSessionError],
  );

  const startCacheOnly = useCallback(
    async ({
      recordings,
      selectedAudioIds,
      selectedMaterialIds,
    }: {
      recordings: EnrichedRecording[];
      selectedAudioIds: Set<string>;
      selectedMaterialIds: Set<number>;
    }) => {
      const tasks = prepareDistinctTasks(
        recordings,
        selectedAudioIds,
        selectedMaterialIds,
      );
      if (tasks.length === 0) return;

      const controller = initSession(tasks);

      try {
        const { skippedList } = await executeQueue(
          tasks,
          controller.signal,
          (completed, currentName) => {
            setProgress({
              completed,
              total: tasks.length,
              percent: Math.round((completed / tasks.length) * 100),
              currentName,
            });
          },
          true,
        );

        if (controller.signal.aborted) return;
        setSkippedItems(skippedList);

        await finalizeSession(
          skippedList.length > 0
            ? "Caching completed (large files skipped)"
            : "All selected tracks cached for offline use!",
        );
      } catch (err: unknown) {
        handleSessionError(controller, err, "Caching failed");
      } finally {
        setIsProcessing(false);
        abortControllerRef.current = null;
      }
    },
    [initSession, finalizeSession, handleSessionError],
  );

  return {
    isProcessing,
    status,
    progress,
    errorMessage,
    skippedItems,
    startZipDownload,
    startCacheOnly,
    cancel,
    reset,
  };
};
