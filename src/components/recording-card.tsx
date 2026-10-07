"use client";

import {
  AlertTriangle,
  Archive,
  Check,
  ChevronDown,
  FileDown,
  FolderDown,
  Link2,
  Loader2,
  Music,
  Pause,
  Play,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { SiYoutube } from "react-icons/si";
import { toast } from "sonner";
import { STREAM_LIMIT_BYTES } from "@/constants";
import { useAudioPlayback } from "@/hooks/use-audio";
import { useBatchDownloader } from "@/hooks/use-batch-downloader";
import { useCategories } from "@/hooks/use-categories";
import { useVideo } from "@/hooks/use-video";
import { audioEngine } from "@/lib/audio-engine";
import { sanitizeFileName } from "@/lib/material-utils";
import { getAssetProxyUrl, getAssetUrl } from "@/lib/storage";
import {
  buildRecordingPermalink,
  cn,
  copyToClipboard,
  parseSize,
} from "@/lib/utils";
import type { EnrichedRecording } from "@/types";
import { RecordingMeta } from "./recording-meta";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface RecordingCardProps {
  rec: EnrichedRecording;
  q: string | null;
  m: string | null;
  onKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
}

const CACHE_NAME = "rsp-audio-cache";

const LargeFileWarning = ({ message }: { message: string }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <span className="inline-flex items-center text-warning shrink-0">
        <AlertTriangle className="w-3 h-3" />
      </span>
    </TooltipTrigger>
    <TooltipContent side="left" className="max-w-xs text-xs">
      {message}
    </TooltipContent>
  </Tooltip>
);

export const RecordingCard = ({ rec, q, m, onKeyDown }: RecordingCardProps) => {
  const { isPlaying, currentAudioId } = useAudioPlayback();
  const [isCached, setIsCached] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { data: categories } = useCategories();
  const [isCopied, setIsCopied] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);
  const { startZipDownload } = useBatchDownloader();
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPressRef = useRef(false);
  const { setYt } = useVideo();

  // Async dynamic cache checking on initial mount without thread block
  useEffect(() => {
    const verifyCacheState = async () => {
      if (!rec.audio_id) return;
      const cache = await caches.open(CACHE_NAME);
      const matched = await cache.match(rec.audio_id);
      setIsCached(!!matched);
    };
    verifyCacheState();
  }, [rec.audio_id]);

  const isHighlighted = q != null && Number(q) === rec.id;
  const isActiveTrack =
    rec.audio_id !== undefined && currentAudioId === rec.audio_id;
  const isOverStreamLimit = parseSize(rec.size) > STREAM_LIMIT_BYTES;
  const hasLargeMaterials = Boolean(
    rec.materials?.some((mat) => parseSize(mat.size) > STREAM_LIMIT_BYTES),
  );
  const hasAnyLargeFiles = isOverStreamLimit || hasLargeMaterials;

  const handlePlayClick = async () => {
    if (!rec.audio_id || isLoading) return;

    if (isActiveTrack) {
      audioEngine.togglePlay();
    } else {
      setIsLoading(true);
      try {
        const url = getAssetProxyUrl(rec.audio_id);
        const cache = await caches.open(CACHE_NAME);
        const cachedResponse = await cache.match(rec.audio_id);

        if (cachedResponse) {
          // Play instantly from local offline cache
          const blob = await cachedResponse.blob();
          await audioEngine.playTrack(rec.audio_id, rec, blob);
        } else {
          // Play immediately via streaming URL (~150ms start)
          await audioEngine.playTrack(rec.audio_id, rec, url);

          // Download and populate CacheStorage in background without interrupting playback
          const response = await fetch(url);
          if (!response.ok) throw new Error("Stream connection drops");
          await cache.put(rec.audio_id, response.clone());
          setIsCached(true);
        }
      } catch (err) {
        console.error("Failed handling execution stream setup", err);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleDownload = async () => {
    if (!rec.audio_id) return;
    const fileName = `${rec.name.replace(/[/\\?%*:|"<>\s]/g, "_")}.mp3`;

    let url = getAssetUrl(rec.audio_id);
    let objectUrl: string | null = null;

    try {
      const cache = await caches.open(CACHE_NAME);
      const matched = await cache.match(rec.audio_id);
      if (matched) {
        const blob = await matched.blob();
        objectUrl = URL.createObjectURL(blob);
        url = objectUrl;
      }
    } catch (err) {
      console.error("Failed to read audio from cache for download:", err);
    }

    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    if (objectUrl) {
      setTimeout(() => URL.revokeObjectURL(objectUrl), 100);
    }
  };

  const handleDownloadMaterials = async () => {
    if (!rec.materials || rec.materials.length === 0 || isBatchProcessing)
      return;
    setIsBatchProcessing(true);
    try {
      const safeName = sanitizeFileName(rec.name);
      await startZipDownload({
        recordings: [rec],
        selectedAudioIds: new Set(),
        selectedMaterialIds: new Set(rec.materials.map((m) => m.id)),
        zipFileName: `${safeName}_materials.zip`,
        shouldCache: true,
      });
      toast.success("Materials download started");
    } catch (err) {
      console.error("Failed downloading materials", err);
      toast.error("Failed to download materials");
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleDownloadAll = async () => {
    if (isBatchProcessing) return;
    setIsBatchProcessing(true);
    try {
      const safeName = sanitizeFileName(rec.name);
      await startZipDownload({
        recordings: [rec],
        selectedAudioIds: rec.audio_id ? new Set([rec.audio_id]) : new Set(),
        selectedMaterialIds: new Set((rec.materials ?? []).map((m) => m.id)),
        zipFileName: `${safeName}_bundle.zip`,
        shouldCache: true,
      });
      toast.success("Bundle download started");
    } catch (err) {
      console.error("Failed downloading bundle", err);
      toast.error("Failed to download bundle");
    } finally {
      setIsBatchProcessing(false);
    }
  };

  const handleTouchStart = () => {
    isLongPressRef.current = false;
    longPressTimerRef.current = setTimeout(() => {
      isLongPressRef.current = true;
      setIsDropdownOpen(true);
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    if (isLongPressRef.current) {
      e.preventDefault();
      isLongPressRef.current = false;
      return;
    }
    handleDownload();
  };

  const handleCopyLink = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const cat = categories?.find((c) => c?.id === rec.category_id);
    const url = buildRecordingPermalink({
      categoryUrlPath: cat?.url_path,
      recId: rec.id,
    });

    const success = await copyToClipboard(url);
    if (success) {
      setIsCopied(true);
      toast.success("Recording link copied to clipboard");
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      toast.error("Failed to copy link");
    }
  };

  const hasMaterials = Boolean(rec.materials && rec.materials.length > 0);

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: handled for custom list focus/navigation
    <div
      // biome-ignore lint/a11y/noNoninteractiveTabindex: handled for custom list focus/navigation
      tabIndex={0}
      data-recording-item
      onKeyDown={onKeyDown}
      className={cn(
        "p-4 border rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-2 group focus:ring-1 focus:ring-primary focus:outline-none transition-all duration-200 ease-in-out",
        isHighlighted
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border bg-card hover:shadow-md",
      )}
    >
      <RecordingMeta {...{ rec, m }} />

      {/* Media Links / Actions */}
      <div className="flex items-center gap-2 self-stretch md:self-auto justify-end border-t md:border-none border-border pt-2 md:pt-0 shrink-0">
        {rec.audio_id && (
          <>
            {!isOverStreamLimit && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handlePlayClick}
                disabled={isLoading}
                className="font-bold text-xs cursor-pointer"
                title={
                  isLoading
                    ? "Loading..."
                    : isActiveTrack && isPlaying
                      ? "Pause Audio"
                      : "Play Audio"
                }
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : isActiveTrack && isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                <span>
                  {isLoading
                    ? "Loading..."
                    : isActiveTrack && isPlaying
                      ? "Pause"
                      : "Play"}
                </span>
                {isCached && !isLoading && (
                  <Check className="w-3 h-3 text-success shrink-0" />
                )}
              </Button>
            )}

            {hasMaterials ? (
              <DropdownMenu
                open={isDropdownOpen}
                onOpenChange={setIsDropdownOpen}
              >
                <div className="inline-flex items-center rounded-lg border border-border bg-background overflow-hidden">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleButtonClick}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      setIsDropdownOpen(true);
                    }}
                    onTouchStart={handleTouchStart}
                    onTouchEnd={handleTouchEnd}
                    onTouchMove={handleTouchEnd}
                    disabled={isBatchProcessing}
                    className="font-bold text-xs cursor-pointer"
                    title="Download Audio (Right-click or long-press for more options)"
                  >
                    {isBatchProcessing ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                    <span className="hidden md:flex">
                      {isBatchProcessing ? "Downloading..." : "Download"}
                    </span>
                  </Button>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={isBatchProcessing}
                      className="px-1.5 cursor-pointer text-muted-foreground hover:text-primary"
                      style={{
                        borderLeft: "1px solid var(--border)",
                        borderTopLeftRadius: 0,
                        borderBottomLeftRadius: 0,
                      }}
                      title="More download options"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                </div>
                <DropdownMenuContent
                  align="end"
                  side="bottom"
                  style={{ width: "16rem" }}
                >
                  <DropdownMenuItem
                    onClick={handleDownload}
                    className="cursor-pointer gap-2 text-xs font-medium justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Music className="w-4 h-4 text-muted-foreground" />
                      <span>Audio Only (.mp3)</span>
                    </div>
                    {isOverStreamLimit && (
                      <LargeFileWarning message="Audio exceeds 100 MB, so it will not be included in ZIP downloads and will open in a separate tab." />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDownloadMaterials}
                    className="cursor-pointer gap-2 text-xs font-medium justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <FolderDown className="w-4 h-4 text-muted-foreground" />
                      <span>
                        Materials Only ({rec.materials?.length}) (.zip)
                      </span>
                    </div>
                    {hasLargeMaterials && (
                      <LargeFileWarning message="Contains file(s) exceeding 100 MB, which will not be included in the ZIP archive and will open in a separate tab." />
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDownloadAll}
                    className="cursor-pointer gap-2 text-xs font-medium justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <Archive className="w-4 h-4 text-muted-foreground" />
                      <span>Complete Bundle (Audio + Materials)</span>
                    </div>
                    {hasAnyLargeFiles && (
                      <LargeFileWarning message="Contains file(s) exceeding 100 MB, which will not be included in the ZIP archive and will open in a separate tab." />
                    )}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownload}
                className="font-bold text-xs cursor-pointer"
                title="Download Audio"
              >
                <FileDown className="w-4 h-4" />
                <span className="hidden md:flex">Download</span>
              </Button>
            )}
          </>
        )}

        {rec.yt_id && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="font-bold text-xs cursor-pointer bg-destructive text-white border-transparent"
            title="Watch on YouTube"
            onClick={() => setYt(rec.yt_id ?? "", rec.name)}
          >
            <SiYoutube className="w-4 h-4" />
            <span className="hidden md:flex">YouTube</span>
          </Button>
        )}

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyLink}
          className="font-bold text-xs cursor-pointer"
          title={isCopied ? "Link copied!" : "Copy link to recording"}
        >
          {isCopied ? (
            <Check className="w-4 h-4 text-success" />
          ) : (
            <Link2 className="w-4 h-4" />
          )}
          <span className="hidden md:flex">
            {isCopied ? "Copied" : "Share"}
          </span>
        </Button>
      </div>
    </div>
  );
};
