import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSession } from "@/components/providers";
import { QUERY_KEY, WORKER_MSG } from "@/constants";
import { rebuildSearchIndex, terminateSearchWorker } from "@/hooks/use-search";
import { toRoleId } from "@/lib/utils";

export const useCleanup = () => {
  const { session, isLoading } = useSession();
  const role = toRoleId(session?.user.app_metadata["role_id"]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isLoading) return;

    const worker = new Worker(new URL("@/workers/cleanup.ts", import.meta.url));
    worker.postMessage({ type: WORKER_MSG.START_CLEANUP, role });
    worker.onmessage = (event: MessageEvent) => {
      if (event.data.type === WORKER_MSG.SUCCESS) {
        terminateSearchWorker();
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEY.ALL_CATEGORIES],
        });
        queryClient.invalidateQueries({
          queryKey: [QUERY_KEY.CATEGORY_PAGE],
        });
        rebuildSearchIndex(queryClient);
      }
      worker.terminate();
    };
    worker.onerror = () => {
      worker.terminate();
    };

    return () => worker.terminate();
  }, [isLoading, role, queryClient]);
};
