import {
  Calendar,
  ExternalLink,
  Globe,
  MapPin,
  Sparkles,
  User,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PHILOSOPHICAL_CONCEPTS } from "@/constants";
import { useCategories } from "@/hooks/use-categories";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useMetadata } from "@/hooks/use-metadata";
import { categoryPath, cn } from "@/lib/utils";
import type { EnrichedRecording } from "@/types";
import { MaterialBadge } from "./material-badge";
import { MaterialsPopover } from "./materials-popover";
import { Skeleton } from "./ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "./ui/tooltip";

interface RecordingMetaProps {
  rec: EnrichedRecording;
  m?: string | null;
  sm?: boolean;
  showLink?: boolean;
}

export const RecordingMeta = ({ rec, m, sm, showLink }: RecordingMetaProps) => {
  const { speakers, languages, venues, events, isPending } = useMetadata();
  const isMobile = useIsMobile();
  const nMaterialPills = isMobile ? 1 : 2;
  const { data: categories } = useCategories();
  const rec_speakers =
    rec.speaker_ids
      ?.map((id) => speakers.find((s) => s.id === id)?.name)
      .join(", ") ?? "";
  const rec_languages =
    rec.lang_ids
      ?.map((id) => languages.find((l) => l.id === id)?.name)
      .join(", ") ?? "";
  const venue = venues.find((v) => v.id === rec.venues_id)?.name ?? "";
  const matchedEvent = events.find((e) => e.id === rec.event_id);
  const eventName = matchedEvent?.short_name || matchedEvent?.name || "";

  const href = showLink
    ? `/${categoryPath(categories?.find((c) => c?.id === rec.category_id)?.url_path ?? "")}?q=${rec.id}`
    : "";

  const materials = rec.materials ?? [];
  const concept =
    PHILOSOPHICAL_CONCEPTS[Math.abs(rec.id) % PHILOSOPHICAL_CONCEPTS.length];

  return (
    <div className={cn("flex-1 flex flex-col", sm ? "gap-1" : "gap-2")}>
      <h3
        className={cn(
          "leading-snug group-hover:text-primary transition-colors flex items-center justify-between gap-2 truncate font-bold text-sm",
          sm && "font-semibold",
        )}
      >
        <span
          className="truncate"
          style={{ maxWidth: isMobile ? "calc(100vw - 4rem)" : "28rem" }}
        >
          {rec.name}
        </span>
        {href && (
          <Link
            href={href}
            prefetch={false}
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors cursor-pointer rounded-md p-1 hover:bg-accent shrink-0"
            title="Navigate to recording details"
          >
            <ExternalLink className="w-3 h-3" />
          </Link>
        )}
      </h3>

      <div
        className={cn(
          "flex items-center gap-2 text-muted-foreground font-medium truncate overflow-hidden",
          sm ? "text-xxs" : "text-xs",
        )}
        style={{
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
                <span className="flex items-center gap-1" key="speaker">
                  <User className="w-3 h-3 text-muted-foreground opacity-80" />
                  {rec_speakers}
                </span>
              ),
              venue && (
                <span className="flex items-center gap-1" key="venue">
                  <MapPin className="w-3 h-3 text-muted-foreground opacity-80" />
                  {venue}
                </span>
              ),
              eventName && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="flex items-center gap-1" key="event">
                      <Sparkles className="w-3 h-3 text-muted-foreground opacity-80" />
                      {eventName}
                    </span>
                  </TooltipTrigger>
                  <TooltipContent side="top">
                    {matchedEvent?.name}
                  </TooltipContent>
                </Tooltip>
              ),
              rec.recorded_at && (
                <span
                  className="flex items-center gap-1"
                  suppressHydrationWarning
                  key="date"
                >
                  <Calendar className="w-3 h-3 text-muted-foreground opacity-80" />
                  {new Date(rec.recorded_at).toLocaleDateString()}
                </span>
              ),
              rec_languages && (
                <span className="flex items-center gap-1" key="lang">
                  <Globe className="w-3 h-3 text-muted-foreground opacity-80" />
                  {rec_languages}
                </span>
              ),
            ]}
      </div>

      {/* Materials Row / Philosophical Concept Pill */}
      <div
        className="pt-2 border-t border-border flex items-center gap-1.5 overflow-hidden"
        style={{
          ...(sm || showLink ? { display: "none" } : {}),
        }}
      >
        {materials.length > 0 ? (
          <>
            {materials.slice(0, nMaterialPills).map((mat) => {
              const isMaterialHighlighted = m != null && Number(m) === mat.id;
              return (
                <MaterialBadge
                  key={mat.id}
                  mat={mat}
                  isHighlighted={isMaterialHighlighted}
                />
              );
            })}
            {materials.length > nMaterialPills && (
              <MaterialsPopover
                materials={materials}
                m={m}
                trigger={
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="text-xxs font-semibold h-6 px-2 shrink-0 cursor-pointer"
                  >
                    +{materials.length - nMaterialPills} more
                  </Button>
                }
              />
            )}
          </>
        ) : (
          <span className="text-xxs font-medium italic text-muted-foreground bg-muted border border-dashed border-border px-2 py-0.5 rounded-md truncate">
            ✨ {concept}
          </span>
        )}
      </div>
    </div>
  );
};
