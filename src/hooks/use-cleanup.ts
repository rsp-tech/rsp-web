import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useSession } from "@/components/providers";
import { LOCAL_STORAGE, QUERY_KEY, STORE, WORKER_MSG } from "@/constants";
import { rebuildSearchIndex, terminateSearchWorker } from "@/hooks/use-search";
import { toRoleId } from "@/lib/utils";

export const useCleanup = () => {
  const { session, isLoading } = useSession();
  const role = toRoleId(session?.user.app_metadata["role_id"]);
  const userId = session?.user?.id ?? null;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isLoading) return;

    const worker = new Worker(new URL("@/workers/cleanup.ts", import.meta.url));
    worker.postMessage({ type: WORKER_MSG.START_CLEANUP, role, userId });
    worker.onmessage = (event: MessageEvent) => {
      if (event.data.type === WORKER_MSG.SUCCESS) {
        if (event.data.clearedUser) {
          try {
            localStorage.removeItem(LOCAL_STORAGE.READ_NOTIFICATIONS);
          } catch (e) {
            console.error(
              `Failed to clear ${LOCAL_STORAGE.READ_NOTIFICATIONS} from localStorage:`,
              e,
            );
          }
          queryClient.invalidateQueries({ queryKey: [STORE.USERS] });
          queryClient.invalidateQueries({ queryKey: [STORE.USER_QUERIES] });
          queryClient.invalidateQueries({
            queryKey: [STORE.USER_EDIT_REQUESTS],
          });
          queryClient.invalidateQueries({
            queryKey: [STORE.USER_SERVICE_INTERESTS],
          });
          queryClient.invalidateQueries({ queryKey: [STORE.QUERY_REPLIES] });
        }

        if (event.data.clearedRole) {
          terminateSearchWorker();
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEY.ALL_CATEGORIES],
          });
          queryClient.invalidateQueries({
            queryKey: [QUERY_KEY.CATEGORY_PAGE],
          });
          rebuildSearchIndex(queryClient);
        }
      }
      worker.terminate();
    };
    worker.onerror = () => {
      worker.terminate();
    };

    return () => worker.terminate();
  }, [isLoading, role, userId, queryClient]);
};
