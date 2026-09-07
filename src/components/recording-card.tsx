"use client";

import { Check, FileDown, Loader2, Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import { SiYoutube } from "react-icons/si";
import { STREAM_LIMIT_BYTES } from "@/constants";
import { useAudioPlayback } from "@/hooks/use-audio";
import { useVideo } from "@/hooks/use-video";
import { audioEngine } from "@/lib/audio-engine";
import { getAssetUrl, getAudioUrl } from "@/lib/storage";
import { cn, parseSize } from "@/lib/utils";
import type { EnrichedRecording } from "@/types";
import { RecordingMeta } from "./recording-meta";
import { Button } from "./ui/button";

interface RecordingCardProps {
  rec: EnrichedRecording;
  q: string | null;
  m: string | null;
  onKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
}

const CACHE_NAME = "rsp-audio-cache";

export const RecordingCard = ({ rec, q, m, onKeyDown }: RecordingCardProps) => {
  const { isPlaying, currentAudioId } = useAudioPlayback();
  const [isCached, setIsCached] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
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

  const handlePlayClick = async () => {
    if (!rec.audio_id || isLoading) return;

    if (isActiveTrack) {
      audioEngine.togglePlay();
    } else {
      setIsLoading(true);
      try {
        const url = getAudioUrl(rec.audio_id);
        const cache = await caches.open(CACHE_NAME);
        let response = await cache.match(rec.audio_id);

        if (!response) {
          response = await fetch(url);
          if (!response.ok) throw new Error("Stream connection drops");
          await cache.put(rec.audio_id, response.clone());
          setIsCached(true);
        }

        const blob = await response.blob();
        await audioEngine.playTrack(rec.audio_id, rec, blob);
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

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: handled for custom list focus/navigation
    <div
      // biome-ignore lint/a11y/noNoninteractiveTabindex: handled for custom list focus/navigation
      tabIndex={0}
      data-recording-item
      onKeyDown={onKeyDown}
      className={cn(
        "p-4 border rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-2 group focus:ring-1 focus:ring-primary focus:outline-hidden transition-all duration-200 ease-in-out",
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
          </>
        )}

        {rec.yt_id && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            className="font-bold text-xs cursor-pointer bg-red-600 hover:bg-red-700 text-white border-transparent"
            title="Watch on YouTube"
            onClick={() => setYt(rec.yt_id ?? "", rec.name)}
          >
            <SiYoutube className="w-4 h-4" />
            <span className="hidden md:flex">YouTube</span>
          </Button>
        )}
      </div>
    </div>
  );
};
