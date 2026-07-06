import { ClockFading, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  useAudioCacheList,
  useDeleteAudioCache,
} from "@/hooks/use-audio-cache";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { RecordingMeta } from "./recording-meta";

export const AudioCacheList = () => {
  const { data: cachedList = [], isLoading } = useAudioCacheList();
  const deleteCache = useDeleteAudioCache();
  const isMobile = useIsMobile();
  const handleDelete = (audioId: string, name: string) => {
    deleteCache.mutate(audioId, {
      onSuccess: () => {
        toast.success(`Deleted cached audio for "${name}"`);
      },
      onError: (err) => {
        console.error("Failed to delete cache:", err);
        toast.error(`Failed to delete "${name}" from cache`);
      },
    });
  };
  return isLoading ? (
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
  ) : cachedList.length === 0 ? (
    <div className="py-16 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl flex flex-col items-center justify-center gap-2">
      <span>No audio files cached yet.</span>
      <span className="text-xxs text-muted-foreground opacity-80">
        Listen to lectures online to save them here for offline access.
      </span>
    </div>
  ) : (
    <div
      className="overflow-y-auto flex flex-col gap-3"
      style={{ maxHeight: "400px", marginRight: "0.25rem" }}
    >
      {cachedList.map((entry) => (
        <div
          key={entry.audio_id}
          className="p-4 border border-border bg-muted/5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-primary/20 transition duration-200"
        >
          <RecordingMeta rec={entry} showLink />

          <div
            style={
              isMobile
                ? {
                    display: "flex",
                    flexDirection: "row-reverse",
                    gap: "0.5rem",
                    alignItems: "center",
                  }
                : {}
            }
          >
            <div className="flex items-center justify-end gap-1 shrink-0 self-stretch">
              <span className="text-xxs text-muted-foreground font-bold bg-muted px-2 py-1 rounded-md">
                {(entry.size / (1024 * 1024)).toFixed(1)} MB
              </span>
              <button
                type="button"
                onClick={() =>
                  handleDelete(entry.audio_id ?? entry.id, entry.name)
                }
                disabled={deleteCache.isPending}
                className="text-destructive hover:bg-destructive/10 p-2 rounded-md cursor-pointer transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                title={`Delete "${entry.name}" from cache`}
              >
                {deleteCache.isPending &&
                deleteCache.variables === (entry.audio_id ?? entry.id) ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
            <div
              className="text-xxs text-muted-foreground flex gap-1 p-1 rounded-md bg-muted"
              title={`last accessed on ${new Date(entry.accessedAt).toLocaleString()}`}
            >
              <ClockFading className="w-3 h-3" />{" "}
              {new Date(entry.accessedAt).toLocaleDateString()}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
