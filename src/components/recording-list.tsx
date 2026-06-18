import {
  ArrowDown,
  ArrowDownZA,
  ArrowUp,
  ArrowUpAZ,
  Calendar,
  CalendarArrowDown,
  CalendarArrowUp,
  FileDown,
  FileText,
  Globe,
  MapPin,
  User,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SiYoutube } from "react-icons/si";
import { trackEvent } from "@/lib/analytics";
import { getAssetUrl } from "@/lib/storage";
import { categoryPath } from "@/lib/utils";
import type { Category, EnrichedRecording } from "@/types";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

interface RecordingListProps {
  recordings: EnrichedRecording[];
  isPending?: boolean;
  category?: Category;
}

const getContentProperties = (rec: EnrichedRecording, category?: Category) => {
  return {
    slug: category ? categoryPath(category.url_path) : "",
    title: rec.name,
    category: category ? category.name : "",
    tags: [
      ...(rec.speakers?.map((s) => s.name) || []),
      ...(rec.languages?.map((l) => l.name) || []),
    ],
  };
};

type SortOption = "order_ind" | "name" | "date";

export const RecordingList = ({
  recordings,
  isPending,
  category,
}: RecordingListProps) => {
  const searchParams = useSearchParams();
  const [sortBy, setSortBy] = useState<SortOption>("order_ind");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const q = searchParams.get("q");
  const m = searchParams.get("m");

  // Autoscroll to selected recording/material
  useEffect(() => {
    if (!isPending && q) {
      // Delay slightly to allow rendering to complete
      const timer = setTimeout(() => {
        const element = document.getElementById(`recording-${q}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPending, q]);

  // Keyboard navigation for recordings
  const handleRecordingKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const recs = Array.from(
      document.querySelectorAll<HTMLElement>("[data-recording-item]"),
    );
    const index = recs.indexOf(e.currentTarget);
    if (index === -1) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = (index + 1) % recs.length;
      recs[next]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (index - 1 + recs.length) % recs.length;
      recs[prev]?.focus();
    }
  };

  const sortedRecordings = [...recordings].sort((a, b) => {
    let result = 0;
    if (sortBy === "name") {
      result = (a.name || "").localeCompare(b.name || "");
    } else if (sortBy === "date") {
      const timeA = a.recorded_at ? new Date(a.recorded_at).getTime() : 0;
      const timeB = b.recorded_at ? new Date(b.recorded_at).getTime() : 0;
      result = timeA - timeB;
    } else {
      const orderA = a.order_ind ?? 0;
      const orderB = b.order_ind ?? 0;
      result = orderA - orderB;
    }
    return sortOrder === "asc" ? result : -result;
  });

  let UpArrow = ArrowUp;
  let DownArrow = ArrowDown;
  if (sortBy === "name") {
    UpArrow = ArrowUpAZ;
    DownArrow = ArrowDownZA;
  } else if (sortBy === "date") {
    UpArrow = CalendarArrowUp;
    DownArrow = CalendarArrowDown;
  }

  return recordings.length === 0 ? (
    <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
      No recordings in this category yet.
    </div>
  ) : (
    <div className="flex flex-col gap-4">
      {/* Sort controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-border/40 mb-2">
        <span className="text-xs font-semibold text-muted-foreground">
          {recordings.length}{" "}
          {recordings.length === 1 ? "recording" : "recordings"} found
        </span>

        <div className="flex items-center gap-3">
          <span className="text-muted-foreground font-bold">Sort by:</span>
          <Select
            value={sortBy}
            onValueChange={(value) => setSortBy(value as SortOption)}
          >
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent position="popper">
              <SelectGroup>
                <SelectItem value="order_ind">Default</SelectItem>
                <SelectItem value="name">By Name</SelectItem>
                <SelectItem value="date">By Date</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>

          <Button
            type="button"
            onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
            title={sortOrder === "asc" ? "Ascending" : "Descending"}
            variant="outline"
          >
            {sortOrder === "asc" ? (
              <UpArrow className="size-4" />
            ) : (
              <DownArrow className="size-4" />
            )}
          </Button>
        </div>
      </div>

      {sortedRecordings.map((rec) => {
        const isHighlighted = q != null && Number(q) === rec.id;
        return (
          // biome-ignore lint/a11y/noStaticElementInteractions: handled for custom list focus/navigation
          <div
            key={rec.id}
            id={`recording-${rec.id}`}
            // biome-ignore lint/a11y/noNoninteractiveTabindex: handled for custom list focus/navigation
            tabIndex={0}
            data-recording-item
            onKeyDown={handleRecordingKeyDown}
            className={`p-5 border rounded-2xl shadow-xs transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group focus:ring-2 focus:ring-primary focus:outline-hidden ${
              isHighlighted
                ? "border-primary bg-primary/5 ring-1 ring-primary"
                : "border-border bg-card hover:shadow-sm"
            }`}
          >
            {/* Meta details */}
            <div className="flex-1 flex flex-col gap-2">
              <h3 className="font-bold text-base text-foreground leading-snug group-hover:text-primary transition-colors">
                {rec.name}
              </h3>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-medium">
                {rec.speakers && rec.speakers.length > 0 && (
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-muted-foreground/75" />
                    {rec.speakers.map((s) => s.name).join(", ")}
                  </span>
                )}
                {rec.venue && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground/75" />
                    {rec.venue.name}
                  </span>
                )}
                {rec.recorded_at && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground/75" />
                    {new Date(rec.recorded_at).toLocaleDateString()}
                  </span>
                )}
                {rec.languages.length > 0 && (
                  <span className="flex items-center gap-1">
                    <Globe className="w-3 h-3 text-muted-foreground/70" />
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
                <div className="mt-2 pt-2 border-t border-border/60 flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                    Supporting Materials ({rec.materials.length})
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {rec.materials.map((mat) => {
                      const isMaterialHighlighted =
                        m != null && Number(m) === mat.id;
                      return (
                        <a
                          key={mat.id}
                          href={getAssetUrl(mat.uri)}
                          download
                          onClick={() => {
                            trackEvent("resource_downloaded", {
                              resource_name: mat.name,
                              resource_type: mat.type,
                              ...getContentProperties(rec, category),
                            });
                          }}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border ${
                            isMaterialHighlighted
                              ? "bg-primary/25 text-primary border-primary ring-1 ring-primary"
                              : "bg-muted hover:bg-primary/10 hover:text-primary text-foreground border-border"
                          }`}
                        >
                          <FileText className="w-3.5 h-3.5 shrink-0" />
                          <span className="truncate max-w-[150px]">
                            {mat.name}
                          </span>
                          <FileDown className="w-3 h-3 text-muted-foreground shrink-0" />
                        </a>
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
                  href={getAssetUrl(rec.audio_id)}
                  download
                  onClick={() => {
                    trackEvent("audio_played", {
                      audio_title: rec.name,
                      ...getContentProperties(rec, category),
                    });
                  }}
                  className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 bg-muted hover:bg-primary hover:text-primary-foreground text-foreground px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-border cursor-pointer"
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
                  className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                  title="Watch on YouTube"
                >
                  <SiYoutube className="w-4 h-4" />
                  <span>YouTube</span>
                </a>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
