import { useEffect } from "react";
import { useSession } from "@/components/providers";

export const useCleanup = () => {
  const { session, isLoading } = useSession();
  const role = session?.user.user_metadata.role_id as number | undefined;

  useEffect(() => {
    if (isLoading) return;
    const worker = new Worker(new URL("@/workers/cleanup.ts", import.meta.url));
    worker.postMessage({ type: "START_CLEANUP", role });
    worker.onmessage = () => worker.terminate();
    worker.onerror = () => worker.terminate();
    return () => worker.terminate();
  }, [isLoading, role]);
};
