import { useEffect } from "react";
import { useSession } from "@/components/providers";
import { WORKER_MSG } from "@/constants";
import { terminateSearchWorker } from "@/hooks/use-search";

const toRoleId = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isInteger(value) ? value : undefined;

export const useCleanup = () => {
  const { session, isLoading } = useSession();
  const role = toRoleId(session?.user.app_metadata.role_id);

  useEffect(() => {
    if (isLoading) return;

    const worker = new Worker(new URL("@/workers/cleanup.ts", import.meta.url));
    worker.postMessage({ type: WORKER_MSG.START_CLEANUP, role });
    worker.onmessage = (event: MessageEvent) => {
      if (event.data.type === WORKER_MSG.SUCCESS) {
        terminateSearchWorker();
      }
      worker.terminate();
    };
    worker.onerror = () => {
      worker.terminate();
    };

    return () => worker.terminate();
  }, [isLoading, role]);
};
