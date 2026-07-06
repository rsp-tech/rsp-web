import { Calendar, Globe, MapPin, User } from "lucide-react";
import type { EnrichedRecording } from "@/types";
import { MaterialBadge } from "./material-badge";
import { useMetadata } from "@/hooks/use-metadata";
import { Skeleton } from "./ui/skeleton";
import { cn } from "@/lib/utils";

interface RecordingMetaProps {
  rec: EnrichedRecording;
  m?: string | null;
  sm?: boolean;
}

export const RecordingMeta = ({ rec, m, sm }: RecordingMetaProps) => {
  const { speakers, languages, venues, isPending } = useMetadata();
  const rec_speakers =
    rec.speaker_ids
      ?.map((id) => speakers.find((s) => s.id === id)?.name)
      .join(", ") ?? "";
  const rec_languages =
    rec.lang_ids
      ?.map((id) => languages.find((l) => l.id === id)?.name)
      .join(", ") ?? "";
  const venue = venues.find((v) => v.id === rec.venues_id)?.name ?? "";

  return (
    <div className={cn("flex-1 flex flex-col", sm ? "gap-1" : "gap-2")}>
      <h3
        className={cn(
          "leading-snug group-hover:text-primary transition-colors",
          sm ? "font-semibold" : "font-bold",
        )}
      >
        {rec.name}
      </h3>

      <div
        className={cn(
          "flex flex-wrap items-center text-muted-foreground font-medium",
          sm ? "text-xxs" : "text-xs",
        )}
        style={{
          columnGap: "1rem",
          rowGap: "0.375rem",
          marginLeft: sm ? "-1.5rem" : undefined,
        }}
      >
        {isPending
          ? new Array(4).fill(0).map((_, i) => (
              <Skeleton
                className="w-10 h-3 animate-shimmer rounded-full"
                // biome-ignore lint/suspicious/noArrayIndexKey: ok for skeleton
                key={i}
              />
            ))
          : [
              rec_speakers && (
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3 text-muted-foreground opacity-80" />
                  {rec_speakers}
                </span>
              ),
              venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-muted-foreground opacity-80" />
                  {venue}
                </span>
              ),
              rec.recorded_at && (
                <span className="flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-muted-foreground opacity-80" />
                  {new Date(rec.recorded_at).toLocaleDateString()}
                </span>
              ),
              rec_languages && (
                <span className="flex items-center gap-1">
                  <Globe className="w-3 h-3 text-muted-foreground opacity-80" />
                  {rec_languages}
                </span>
              ),
            ]}
      </div>

      {/* Materials Downloads List */}
      {!!rec.materials?.length && (
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
  );
};
