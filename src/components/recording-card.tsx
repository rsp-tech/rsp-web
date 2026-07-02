"use client";

import { Calendar, FileDown, Globe, MapPin, User } from "lucide-react";
import { SiYoutube } from "react-icons/si";
import { getAssetDownloadUrl } from "@/lib/storage";
import { cn } from "@/lib/utils";
import type { EnrichedRecording } from "@/types";
import { MaterialBadge } from "./material-badge";

interface RecordingCardProps {
  rec: EnrichedRecording;
  q: string | null;
  m: string | null;
  onKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
}

export function RecordingCard({ rec, q, m, onKeyDown }: RecordingCardProps) {
  const isHighlighted = q != null && Number(q) === rec.id;

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: handled for custom list focus/navigation
    <div
      id={`recording-${rec.id}`}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: handled for custom list focus/navigation
      tabIndex={0}
      data-recording-item
      onKeyDown={onKeyDown}
      className={cn(
        "p-4 border rounded-2xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group focus:ring-1 focus:ring-primary focus:outline-hidden transition duration-200 ease-in-out",
        isHighlighted
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border bg-card hover:shadow-md",
      )}
    >
      {/* Meta details */}
      <div className="flex-1 flex flex-col gap-2">
        <h3 className="font-bold leading-snug group-hover:text-primary transition-colors">
          {rec.name}
        </h3>

        <div
          className="flex flex-wrap items-center text-xs text-muted-foreground font-medium"
          style={{ columnGap: "1rem", rowGap: "0.375rem" }}
        >
          {rec.speakers && rec.speakers.length > 0 && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3 text-muted-foreground opacity-80" />
              {rec.speakers.map((s) => s.name).join(", ")}
            </span>
          )}
          {rec.venue && (
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-muted-foreground opacity-80" />
              {rec.venue.name}
            </span>
          )}
          {rec.recorded_at && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3 text-muted-foreground opacity-80" />
              {new Date(rec.recorded_at).toLocaleDateString()}
            </span>
          )}
          {rec.languages.length > 0 && (
            <span className="flex items-center gap-1">
              <Globe className="w-3 h-3 text-muted-foreground opacity-80" />
              {rec.languages
                .map((l) =>
                  l.name === l.native_name
                    ? l.name
                    : `${l.name} (${l.native_name})`,
                )
                .join(", ")}
            </span>
          )}
        </div>

        {/* Materials Downloads List */}
        {rec.materials && rec.materials.length > 0 && (
          <div className="mt-2 pt-2 border-t border-border flex flex-col gap-1.5">
            <span className="text-xxs font-bold tracking-wider uppercase text-muted-foreground">
              Supporting Materials ({rec.materials.length})
            </span>
            <div className="flex flex-wrap gap-2">
              {rec.materials.map((mat) => {
                const isMaterialHighlighted = m != null && Number(m) === mat.id;
                return (
                  <MaterialBadge
                    key={mat.id}
                    mat={mat}
                    isHighlighted={isMaterialHighlighted}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Media Links / Actions */}
      <div className="flex items-center gap-2 self-stretch md:self-auto justify-end border-t md:border-none border-border pt-3 md:pt-0 shrink-0">
        {rec.audio_id && (
          <a
            href={getAssetDownloadUrl(rec.audio_id)}
            download={true}
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 bg-muted hover:bg-primary hover:text-primary-foreground px-3.5 py-2 rounded-xl text-xs font-bold transition duration-200 active:scale-98 border border-border cursor-pointer"
            title="Download Audio"
          >
            <FileDown className="w-4 h-4" />
            <span>Audio</span>
          </a>
        )}

        {rec.yt_id && (
          <a
            href={`https://youtube.com/watch?v=${rec.yt_id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition duration-200 active:scale-98 cursor-pointer"
            title="Watch on YouTube"
          >
            <SiYoutube className="w-4 h-4" />
            <span>YouTube</span>
          </a>
        )}
      </div>
    </div>
  );
}
