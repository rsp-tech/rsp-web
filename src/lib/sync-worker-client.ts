import { WORKER_MSG } from "@/constants";
import type { SyncResult, SyncWorkerMessage } from "@/types";
import { CACHE_NAME } from "@/workers/meta-cache";

interface JobPromise {
  resolve: (result: SyncResult) => void;
  reject: (err: Error) => void;
  onProgress?: (message: string) => void;
}

let workerInstance: Worker | null = null;
let idleTimer: ReturnType<typeof setTimeout> | null = null;
const pendingJobs = new Map<string, JobPromise>();

const IDLE_TIMEOUT_MS = 5000;

const clearIdleTimer = () => {
  if (idleTimer) {
    clearTimeout(idleTimer);
    idleTimer = null;
  }
};

export const terminateWorker = () => {
  clearIdleTimer();
  if (workerInstance) {
    workerInstance.terminate();
    workerInstance = null;
  }
};

export const clearSyncMetaCache = async () => {
  if (typeof window !== "undefined" && window.caches) {
    await window.caches.delete(CACHE_NAME).catch(() => {});
  }
  terminateWorker();
};

const checkIdleAndScheduleTermination = () => {
  if (pendingJobs.size === 0) {
    clearIdleTimer();
    idleTimer = setTimeout(() => {
      if (pendingJobs.size === 0) {
        terminateWorker();
      }
    }, IDLE_TIMEOUT_MS);
  }
};

const rejectAllPendingJobs = (error: Error) => {
  for (const job of pendingJobs.values()) {
    job.reject(error);
  }
  pendingJobs.clear();
  terminateWorker();
};

const getWorker = (): Worker => {
  clearIdleTimer();

  if (workerInstance) return workerInstance;

  workerInstance = new Worker(new URL("@/workers/sync.ts", import.meta.url));

  workerInstance.onmessage = (e: MessageEvent<SyncWorkerMessage>) => {
    const data = e.data;
    const jobId = data?.jobId;
    if (!jobId) return;

    const job = pendingJobs.get(jobId);
    if (!job) return;

    if (data.type === WORKER_MSG.PROGRESS) {
      job.onProgress?.(data.message);
    } else if (data.type === WORKER_MSG.SUCCESS) {
      pendingJobs.delete(jobId);
      checkIdleAndScheduleTermination();
      job.resolve(data);
    } else if (data.type === WORKER_MSG.ERROR) {
      pendingJobs.delete(jobId);
      checkIdleAndScheduleTermination();
      job.reject(new Error(data.message));
    }
  };

  workerInstance.onerror = (err) => {
    console.error("Sync worker fatal error:", err);
    rejectAllPendingJobs(new Error("Sync worker crashed"));
  };

  workerInstance.onmessageerror = (err) => {
    console.error("Sync worker deserialization error:", err);
    rejectAllPendingJobs(
      new Error("Sync worker message deserialization failed"),
    );
  };

  return workerInstance;
};

export const dispatchSyncJob = (
  payload: Record<string, unknown>,
  onProgress?: (message: string) => void,
): Promise<SyncResult> => {
  return new Promise<SyncResult>((resolve, reject) => {
    const type = typeof payload["type"] === "string" ? payload["type"] : "job";
    const jobId = `${type}-${crypto.randomUUID()}`;

    pendingJobs.set(jobId, { resolve, reject, onProgress });

    try {
      const worker = getWorker();
      worker.postMessage({ ...payload, jobId });
    } catch (err) {
      pendingJobs.delete(jobId);
      checkIdleAndScheduleTermination();
      reject(err instanceof Error ? err : new Error(String(err)));
    }
  });
};
