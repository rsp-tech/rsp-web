"use client";

import {
  Calendar,
  ChevronRight,
  FileText,
  Globe,
  MapPin,
  Music,
  User,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useRef } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { trackEvent } from "@/lib/analytics";
import { getCategoryImageUrl } from "@/lib/storage";
import { categoryPath } from "@/lib/utils";
import type {
  Category,
  Language,
  Material,
  Recording,
  Speaker,
  Venue,
} from "@/types";

export interface EnrichedRecordingSearchResult extends Recording {
  speakers: Speaker[];
  venue: Venue | null;
  languages: Language[];
  category: Category | null;
}

export interface EnrichedMaterialSearchResult extends Material {
  recording: Recording | null;
  category: Category | null;
}

interface SearchResultsProps {
  categories: Category[];
  recordings: EnrichedRecordingSearchResult[];
  materials: EnrichedMaterialSearchResult[];
  onSelectCategory: (cat: Category) => void;
  onSelectRecording: (rec: Recording) => void;
  onSelectMaterial: (mat: EnrichedMaterialSearchResult) => void;
  term: string;
  hasCategoryContext: boolean;
}

export function SearchResults({
  categories,
  recordings,
  materials,
  onSelectCategory,
  onSelectRecording,
  onSelectMaterial,
  term,
  hasCategoryContext,
}: SearchResultsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const hasResults =
    categories.length > 0 || recordings.length > 0 || materials.length > 0;

  // Keyboard navigation within search results
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!containerRef.current) return;

      // Only select items that are visible/focusable in the DOM (not collapsed)
      const items = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(
          "[data-search-item]",
        ),
      ).filter((item) => item.offsetParent !== null); // offsetParent is null if element or ancestor is display: none

      if (items.length === 0) return;

      const currentIndex = items.indexOf(document.activeElement as HTMLElement);

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % items.length;
        items[nextIndex]?.focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prevIndex = (currentIndex - 1 + items.length) % items.length;
        items[prevIndex]?.focus();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  if (!term.trim()) {
    return (
      <p className="py-4 text-center text-xs text-muted-foreground">
        Type something to search{" "}
        {hasCategoryContext ? "within selected scope" : ""}
      </p>
    );
  }

  if (!hasResults) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No matching results found
      </p>
    );
  }

  return (
    <div
      ref={containerRef}
      className="overflow-y-auto flex-1 p-2 flex flex-col"
    >
      <Accordion
        type="single"
        defaultValue={
          recordings.length
            ? "recordings"
            : categories.length
              ? "categories"
              : "materials"
        }
        className="w-full"
        collapsible
        key={`${recordings.length}-${categories.length}-${materials.length}`}
      >
        {/* Recordings Section */}
        {recordings.length > 0 && (
          <AccordionItem
            value="recordings"
            className="border-none"
            key="recordings"
          >
            <AccordionTrigger className="hover:no-underline py-2 px-2 text-xxs font-bold tracking-wider uppercase text-muted-foreground/80 hover:text-foreground transition-colors">
              Recordings ({recordings.length})
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="flex flex-col gap-1">
                {recordings.map((rec, idx) => (
                  <button
                    key={rec.id}
                    type="button"
                    data-search-item
                    onClick={() => {
                      const idxClicked = recordings.indexOf(rec);
                      trackEvent("search_result_clicked", {
                        query_term: term,
                        clicked_slug: rec.category
                          ? `${categoryPath(rec.category.url_path)}?q=${rec.id}`
                          : `?q=${rec.id}`,
                        position_index: idxClicked,
                      });
                      onSelectRecording(rec);
                    }}
                    className="w-full text-left flex flex-col gap-1.5 px-3 py-2.5 rounded-lg text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-hidden transition-colors border border-transparent hover:border-border/50 cursor-pointer animate-stagger-fade-in-up"
                    style={
                      {
                        "--stagger-delay": `${idx * 25}ms`,
                      } as React.CSSProperties
                    }
                  >
                    <div className="flex items-start justify-between gap-2 w-full">
                      <div className="flex items-center gap-2">
                        <Music className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span className="font-semibold text-foreground leading-snug line-clamp-2">
                          {rec.name}
                        </span>
                      </div>
                      {rec.category && (
                        <span className="text-xxs bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-medium shrink-0 max-w-25 truncate">
                          {rec.category.name}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xxs text-muted-foreground pl-6 font-medium">
                      {rec.speakers.length > 0 && (
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3 text-muted-foreground/70" />
                          {rec.speakers.map((s) => s.name).join(", ")}
                        </span>
                      )}
                      {rec.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-muted-foreground/70" />
                          {rec.venue.name}
                        </span>
                      )}
                      {rec.recorded_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="size-3 text-muted-foreground/70" />
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
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Categories Section */}
        {categories.length > 0 && (
          <AccordionItem
            value="categories"
            className="border-none"
            key="categories"
          >
            <AccordionTrigger className="hover:no-underline py-2 px-2 text-xxs font-bold tracking-wider uppercase text-muted-foreground/80 hover:text-foreground transition-colors">
              Categories ({categories.length})
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="flex flex-col gap-0.5">
                {categories.map((cat, idx) => (
                  <button
                    key={cat.id}
                    type="button"
                    data-search-item
                    onClick={() => {
                      const idxClicked =
                        recordings.length + categories.indexOf(cat);
                      trackEvent("search_result_clicked", {
                        query_term: term,
                        clicked_slug: categoryPath(cat.url_path),
                        position_index: idxClicked,
                      });
                      onSelectCategory(cat);
                    }}
                    className="w-full text-left justify-start gap-2 flex items-center px-3 py-2 rounded-lg text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-hidden transition-colors cursor-pointer animate-stagger-fade-in-up"
                    style={
                      {
                        "--stagger-delay": `${idx * 25}ms`,
                      } as React.CSSProperties
                    }
                  >
                    <Image
                      src={getCategoryImageUrl(cat) ?? "/rsp.webp"}
                      alt=""
                      className="size-8 rounded-md object-cover"
                    />
                    <span className="truncate font-medium">{cat.name}</span>
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Materials Section */}
        {materials.length > 0 && (
          <AccordionItem
            value="materials"
            className="border-none"
            key="materials"
          >
            <AccordionTrigger className="hover:no-underline py-2 px-2 text-xxs font-bold tracking-wider uppercase text-muted-foreground/80 hover:text-foreground transition-colors">
              Materials ({materials.length})
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="flex flex-col gap-0.5">
                {materials.map((mat, idx) => (
                  <button
                    key={mat.id}
                    type="button"
                    data-search-item
                    onClick={() => {
                      const idxClicked =
                        recordings.length +
                        categories.length +
                        materials.indexOf(mat);
                      trackEvent("search_result_clicked", {
                        query_term: term,
                        clicked_slug: mat.category
                          ? `${categoryPath(mat.category.url_path)}?q=${mat.recording_id}&m=${mat.id}`
                          : `?q=${mat.recording_id}&m=${mat.id}`,
                        position_index: idxClicked,
                      });
                      onSelectMaterial(mat);
                    }}
                    className="w-full text-left flex flex-col gap-0.5 px-3 py-2 rounded-lg text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-hidden transition-colors cursor-pointer animate-stagger-fade-in-up"
                    style={
                      {
                        "--stagger-delay": `${idx * 25}ms`,
                      } as React.CSSProperties
                    }
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-warning shrink-0" />
                      <span className="font-semibold text-foreground truncate">
                        {mat.name}
                      </span>
                    </div>
                    {(mat.category || mat.recording) && (
                      <div className="text-xxs text-muted-foreground pl-6 flex items-center gap-1 font-medium truncate">
                        {mat.category && <span>{mat.category.name}</span>}
                        {mat.category && mat.recording && (
                          <ChevronRight className="w-2.5 h-2.5 shrink-0" />
                        )}
                        {mat.recording && (
                          <span className="truncate">{mat.recording.name}</span>
                        )}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}
      </Accordion>
    </div>
  );
}
