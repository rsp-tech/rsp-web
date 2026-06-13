"use client";

import {
  ChevronRight,
  FileText,
  Folder,
  Globe,
  MapPin,
  Music,
  User,
} from "lucide-react";
import { useEffect, useRef } from "react";
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

      const items = Array.from(
        containerRef.current.querySelectorAll<HTMLElement>(
          "[data-search-item]",
        ),
      );
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
      className="overflow-y-auto flex-1 p-2 flex flex-col gap-3"
    >
      {/* Categories */}
      {categories.length > 0 && (
        <div>
          <h4 className="px-2 pb-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/85">
            Categories
          </h4>
          <div className="flex flex-col gap-0.5">
            {categories.slice(0, 4).map((cat) => (
              <button
                key={cat.id}
                type="button"
                data-search-item
                onClick={() => onSelectCategory(cat)}
                className="w-full text-left justify-start gap-2 flex items-center px-3 py-2 rounded-lg text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-hidden transition-colors"
              >
                <Folder className="w-4 h-4 text-primary shrink-0" />
                <span className="truncate font-medium">{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recordings */}
      {recordings.length > 0 && (
        <div>
          <h4 className="px-2 pb-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/85">
            Recordings
          </h4>
          <div className="flex flex-col gap-1">
            {recordings.slice(0, 6).map((rec) => (
              <button
                key={rec.id}
                type="button"
                data-search-item
                onClick={() => onSelectRecording(rec)}
                className="w-full text-left flex flex-col gap-1.5 px-3 py-2.5 rounded-lg text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-hidden transition-colors border border-transparent hover:border-border/50"
              >
                <div className="flex items-start justify-between gap-2 w-full">
                  <div className="flex items-center gap-2">
                    <Music className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <span className="font-semibold text-foreground leading-snug line-clamp-2">
                      {rec.name}
                    </span>
                  </div>
                  {rec.category && (
                    <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-md font-medium shrink-0 max-w-[100px] truncate">
                      {rec.category.name}
                    </span>
                  )}
                </div>

                {/* Metadata badges/row */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground pl-6 font-medium">
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
                  {rec.languages.length > 0 && (
                    <span className="flex items-center gap-1">
                      <Globe className="w-3 h-3 text-muted-foreground/70" />
                      {rec.languages.map((l) => l.name).join(", ")}
                    </span>
                  )}
                  {rec.recorded_at && (
                    <span className="text-[10px] opacity-75">
                      {new Date(rec.recorded_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Materials */}
      {materials.length > 0 && (
        <div>
          <h4 className="px-2 pb-1 text-[10px] font-bold tracking-wider uppercase text-muted-foreground/85">
            Materials
          </h4>
          <div className="flex flex-col gap-0.5">
            {materials.slice(0, 5).map((mat) => (
              <button
                key={mat.id}
                type="button"
                data-search-item
                onClick={() => onSelectMaterial(mat)}
                className="w-full text-left flex flex-col gap-0.5 px-3 py-2 rounded-lg text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-hidden transition-colors"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500 shrink-0" />
                  <span className="font-semibold text-foreground truncate">
                    {mat.name}
                  </span>
                </div>
                {(mat.category || mat.recording) && (
                  <div className="text-[10px] text-muted-foreground pl-6 flex items-center gap-1 font-medium truncate">
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
        </div>
      )}
    </div>
  );
}
