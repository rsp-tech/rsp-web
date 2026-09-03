"use client";

import { FileText, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  useDeleteMaterialCache,
  useMaterialsCacheList,
} from "@/hooks/use-audio-cache";

const formatMaterialSize = (bytes: number): string => {
  if (!bytes || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const MaterialsCacheList = () => {
  const { data: cachedMaterials = [], isLoading } = useMaterialsCacheList();
  const deleteCache = useDeleteMaterialCache();

  const handleDelete = (uri: string, name: string) => {
    deleteCache.mutate(uri, {
      onSuccess: () => {
        toast.success(`Removed "${name}" from materials cache`);
      },
      onError: (err) => {
        console.error("Failed to delete material cache:", err);
        toast.error(`Failed to remove "${name}" from cache`);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-4">
        {[1, 2, 3].map((n) => (
          <div
            key={n}
            className="p-4 border border-border bg-muted/5 rounded-xl flex items-center justify-between gap-4 animate-shimmer"
          >
            <div className="h-8 bg-muted rounded-md w-16" />
          </div>
        ))}
      </div>
    );
  }

  if (cachedMaterials.length === 0) {
    return (
      <div className="py-16 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2">
        <span>No study materials cached yet.</span>
        <span className="text-xxs text-muted-foreground opacity-80">
          Downloaded study materials and handouts will be saved here for offline
          viewing.
        </span>
      </div>
    );
  }

  return (
    <div
      className="overflow-y-auto flex flex-col gap-3"
      style={{ maxHeight: "400px", marginRight: "0.25rem" }}
    >
      {cachedMaterials.map((mat) => (
        <div
          key={mat.uri}
          className="p-3 border border-border bg-muted/5 rounded-xl flex items-center justify-between gap-3 hover:bg-primary/20 transition-all duration-200"
        >
          <div
            className="flex items-center gap-3 flex-1"
            style={{ minWidth: 0 }}
          >
            <FileText className="w-4 h-4 text-primary shrink-0" />
            <div className="flex flex-col flex-1" style={{ minWidth: 0 }}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="text-xs font-semibold truncate">
                    {mat.name}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs max-w-sm">
                  {mat.name}
                </TooltipContent>
              </Tooltip>
              {mat.type && (
                <span className="text-xxs text-muted-foreground truncate uppercase">
                  {mat.type}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xxs text-muted-foreground font-bold bg-muted px-2 py-1 rounded-md">
              {formatMaterialSize(mat.size)}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleDelete(mat.uri, mat.name)}
              disabled={deleteCache.isPending}
              className="text-destructive hover:bg-destructive/10 h-8 w-8 p-0 cursor-pointer transition-all"
              title={`Remove "${mat.name}" from cache`}
            >
              {deleteCache.isPending && deleteCache.variables === mat.uri ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Trash2 className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};
