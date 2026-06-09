"use client";

import {
  type QueryClient,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useSession } from "@/components/providers";
import {
  SUPABASE_PUBLISHABLE_KEY,
  SUPABASE_URL,
  SYNC_INTERVAL,
} from "@/lib/constants";

interface WorkerConfig {
  supabaseUrl: string;
  supabaseKey: string;
  accessToken: string;
  queryClient: QueryClient;
}

const runSync = ({ queryClient, ...config }: WorkerConfig): Promise<void> =>
  new Promise((resolve, reject) => {
    const worker = new Worker(new URL("@/workers/sync.ts", import.meta.url));
    worker.postMessage({ type: "START_SYNC", ...config });
    worker.onmessage = (e: MessageEvent) => {
      if (e.data.type === "SUCCESS") {
        worker.terminate();
        const changedCategoryPaths = e.data.changedCategoryPaths;
        if (changedCategoryPaths.length > 100) {
          queryClient.invalidateQueries({ queryKey: ["category-page"] });
        } else {
          for (const path of changedCategoryPaths) {
            queryClient.invalidateQueries({
              queryKey: ["category-page", path],
            });
          }
        }
        resolve();
      } else if (e.data.type === "ERROR") {
        worker.terminate();
        reject(new Error(e.data.message));
      }
    };
    worker.onerror = (e) => {
      worker.terminate();
      reject(e);
    };
  });

export const useSync = () => {
  const { session, isLoading } = useSession();
  const queryClient = useQueryClient();
  const workerConfig = {
    supabaseUrl: SUPABASE_URL,
    supabaseKey: SUPABASE_PUBLISHABLE_KEY,
    accessToken: session?.access_token ?? "",
    queryClient,
  };
  return useQuery({
    queryKey: ["sync"],
    queryFn: () => runSync(workerConfig),
    staleTime: SYNC_INTERVAL,
    refetchInterval: SYNC_INTERVAL,
    enabled: !isLoading,
  });
};
