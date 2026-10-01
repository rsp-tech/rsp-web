"use client";

import { FileText, Music } from "lucide-react";
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
  EnrichedMaterialSearchResult,
  EnrichedRecording,
  Recording,
} from "@/types";
import { MaterialLineage } from "../material-lineage";
import { RecordingMeta } from "../recording-meta";

interface SearchResultsProps {
  categories: Category[];
  recordings: EnrichedRecording[];
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
      ).filter((item) => !item.closest('[data-state="closed"]'));

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
          <AccordionItem value="recordings" key="recordings">
            <AccordionTrigger className="hover:no-underline py-2 px-2 text-xxs font-bold tracking-wider uppercase text-muted-foreground opacity-80 hover:transition-all">
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
                    className="relative w-full text-left flex gap-2 px-3 py-2 rounded-lg text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none transition-all border border-transparent hover:border-border cursor-pointer opacity-0"
                    style={{
                      animation:
                        "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                      animationDelay: `${idx * 50}ms`,
                    }}
                  >
                    <Music className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <RecordingMeta rec={rec} sm />
                    {rec.category && (
                      <span
                        className="absolute text-xxs italic bg-primary px-1.5 rounded-full font-medium shrink-0"
                        style={{
                          top: "-0.1rem",
                          right: "-0.1rem",
                          opacity: 0.8,
                          color: "white",
                        }}
                      >
                        {rec.category.name}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Categories Section */}
        {categories.length > 0 && (
          <AccordionItem value="categories" key="categories">
            <AccordionTrigger className="hover:no-underline py-2 px-2 text-xxs font-bold tracking-wider uppercase text-muted-foreground opacity-80 hover:transition-all">
              Categories ({categories.length})
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="flex flex-col gap-1">
                {categories.map((cat, idx) => {
                  const imgUrl =
                    getCategoryImageUrl(cat, "webp") ?? "/rsp.webp";
                  const avifUrl =
                    getCategoryImageUrl(cat, "avif") ?? "/rsp.webp";
                  return (
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
                      className="w-full text-left justify-start gap-2 flex items-center px-3 py-2 rounded-lg text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none transition-all cursor-pointer opacity-0"
                      style={{
                        animation:
                          "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                        animationDelay: `${idx * 50}ms`,
                      }}
                    >
                      <picture>
                        <source srcSet={avifUrl} type="image/avif" />
                        <img
                          src={imgUrl}
                          alt=""
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-md object-cover"
                          loading="lazy"
                        />
                      </picture>
                      <span className="truncate font-medium">{cat.name}</span>
                    </button>
                  );
                })}
              </div>
            </AccordionContent>
          </AccordionItem>
        )}

        {/* Materials Section */}
        {materials.length > 0 && (
          <AccordionItem value="materials" key="materials">
            <AccordionTrigger className="hover:no-underline py-2 px-2 text-xxs font-bold tracking-wider uppercase text-muted-foreground opacity-80 hover:transition-all">
              Materials ({materials.length})
            </AccordionTrigger>
            <AccordionContent className="pb-2">
              <div className="flex flex-col gap-1">
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
                    className="w-full text-left flex flex-col gap-1 px-3 py-2 rounded-lg text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none transition-all cursor-pointer opacity-0"
                    style={{
                      animation:
                        "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                      animationDelay: `${idx * 50}ms`,
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-warning shrink-0" />
                      <span className="font-semibold truncate">{mat.name}</span>
                    </div>
                    <MaterialLineage
                      category={mat.category}
                      recording={mat.recording}
                    />
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
