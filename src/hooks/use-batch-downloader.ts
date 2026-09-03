"use client";

import { useQueryClient } from "@tanstack/react-query";
import { type AsyncZippable, zip } from "fflate";
import { useCallback, useRef, useState } from "react";
import { AUDIO_CACHE_NAME, MATERIALS_CACHE_NAME, QUERY_KEY } from "@/constants";
import { getAudioCacheSettings } from "@/hooks/use-audio-cache";
import { enforceLRUWatermark, touchTrackMeta } from "@/lib/audio-idb-ledger";
import {
  getMaterialExtension,
  guessExtensionFromBytesAndMime,
  isMaterialLink,
  resolveMaterialFileName,
  sanitizeFileName,
} from "@/lib/material-utils";
import { getAudioUrl } from "@/lib/storage";
import type { EnrichedRecording, Material } from "@/types";

export {
  getMaterialExtension,
  guessExtensionFromBytesAndMime,
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

export interface UseBatchDownloaderReturn {
  isProcessing: boolean;
  status: "idle" | "downloading" | "zipping" | "completed" | "error";
  progress: BatchDownloadProgress;
  errorMessage: string | null;
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
}

export interface FetchedFileResult {
  key: string;
  data: Uint8Array;
  mimeType: string;
}

const CONCURRENCY_LIMIT = 3;

const fetchItemData = async (
  task: FetchTask,
  signal: AbortSignal,
  shouldCache = true,
): Promise<FetchedFileResult> => {
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

    if (shouldCache && typeof window !== "undefined" && "caches" in window) {
      try {
        const settings = getAudioCacheSettings();
        const canCache =
          task.type === "audio" || settings.enableMaterialsCache !== false;

        if (canCache) {
          const cache = await caches.open(task.cacheName);
          await cache.put(task.cacheKey, res.clone());

          if (task.type === "audio" && task.recId) {
            const contentLength = res.headers.get("content-length");
            const size = contentLength ? parseInt(contentLength, 10) : 0;
            await touchTrackMeta(String(task.cacheKey), task.recId, size);
          }
        }
      } catch (err) {
        console.warn("Failed to write to cache for", task.name, err);
      }
    }

    blob = await res.blob();
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
            // Use getAudioUrl for materials as well to avoid CORS restrictions
            url: getAudioUrl(mat.uri),
            cacheKey: mat.uri,
            cacheName: MATERIALS_CACHE_NAME,
            material: mat,
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
        matRefCount.set(uri, (matRefCount.get(uri) || 0) + 1);
        if (!matSampleMap.has(uri)) {
          matSampleMap.set(uri, mat);
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
        const resolvedFileName = resolveMaterialFileName(mat, fileRes);
        const sharedPath = `shared-materials/${resolvedFileName}`;
        if (fileRes?.data) {
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
    const recMats = (rec.materials ?? []).filter((m) =>
      selectedMaterialIds.has(m.id),
    );
    const downloadableMats = recMats.filter(
      (m) => m.uri && !isMaterialLink(m.uri),
    );
    const linkMats = recMats.filter((m) => isMaterialLink(m.uri));

    const exclusiveMats = downloadableMats.filter((m) => !isShared(m.uri));
    const sharedMatsForRec = downloadableMats.filter((m) => isShared(m.uri));

    const safeRecName = sanitizeFileName(rec.name);
    const hasAnyMatsForRec = recMats.length > 0;

    // Rule: If only audio is selected for a recording -> add it to the zip root
    if (hasAudioSelected && !hasAnyMatsForRec) {
      const audioRes = fileResultMap.get(`audio:${rec.audio_id}`);
      if (audioRes?.data) {
        zipData[`${safeRecName}.mp3`] = audioRes.data;
      }
    } else if (hasAudioSelected || hasAnyMatsForRec) {
      // Create a folder for the recording
      const folder = safeRecName;

      if (hasAudioSelected) {
        const audioRes = fileResultMap.get(`audio:${rec.audio_id}`);
        if (audioRes?.data) {
          zipData[`${folder}/${safeRecName}.mp3`] = audioRes.data;
        }
      }

      // Add exclusive materials to recording folder with resolved extension
      for (const mat of exclusiveMats) {
        const fileRes = fileResultMap.get(`mat:${mat.uri?.trim()}`);
        const resolvedFileName = resolveMaterialFileName(mat, fileRes);
        if (fileRes?.data) {
          zipData[`${folder}/${resolvedFileName}`] = fileRes.data;
        }
      }

      // Generate reference-materials.md if this recording has shared materials or links
      if (sharedMatsForRec.length > 0 || linkMats.length > 0) {
        let md = `# Reference Materials for ${rec.name}\n\n`;

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
): Promise<Map<string, FetchedFileResult>> => {
  const resultsMap = new Map<string, FetchedFileResult>();
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

      completedCount += 1;
      onProgress(completedCount, task.name);
    }
  };

  const workers = Array.from(
    { length: Math.min(CONCURRENCY_LIMIT, tasks.length) },
    () => worker(),
  );

  await Promise.all(workers);
  return resultsMap;
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

  const abortControllerRef = useRef<AbortController | null>(null);
  const queryClient = useQueryClient();

  const reset = useCallback(() => {
    setIsProcessing(false);
    setStatus("idle");
    setProgress({ completed: 0, total: 0, percent: 0, currentName: "" });
    setErrorMessage(null);
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
        const fileResultMap = await executeQueue(
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

        // SINGLE FILE DIRECT DOWNLOAD
        if (tasks.length === 1) {
          const singleTask = tasks[0];
          const fileRes = fileResultMap.get(singleTask.key);
          if (fileRes?.data) {
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

        await finalizeSession("Download completed successfully!");
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
        await executeQueue(
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

        await finalizeSession("All selected tracks cached for offline use!");
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
    startZipDownload,
    startCacheOnly,
    cancel,
    reset,
  };
};
