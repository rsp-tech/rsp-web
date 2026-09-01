"use client";

import { ChevronLeft, ChevronRight, Layers } from "lucide-react";
import { useRef } from "react";
import { CategoryCard } from "@/components/category-card";
import { RecordingCard } from "@/components/recording-card";
import { Button } from "@/components/ui/button";
import type { EnrichedFeaturedSection } from "@/types";

interface FeaturedSectionProps {
  section: EnrichedFeaturedSection;
}

const noop = () => {};

const FeaturedSectionCard = ({
  item,
}: {
  item: EnrichedFeaturedSection["items"][number];
}) => (
  <>
    {item.category && <CategoryCard cat={item.category} />}
    {item.recording && (
      <RecordingCard rec={item.recording} q={null} m={null} onKeyDown={noop} />
    )}
  </>
);

export const FeaturedSection = ({ section }: FeaturedSectionProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (!section?.items || section.items.length === 0) {
    return null;
  }

  const handleScroll = (direction: "left" | "right") => {
    if (!scrollRef.current) return;
    const scrollAmount = 320;
    scrollRef.current.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  const layout = section.layout || "grid";

  return (
    <section aria-label={section.title} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-primary" />
          <h2 className="text-2xl font-bold font-heading text-foreground">
            {section.title}
          </h2>
        </div>

        {layout === "carousel" && section.items.length > 2 && (
          <div className="flex items-center gap-1">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-full cursor-pointer"
              onClick={() => handleScroll("left")}
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 rounded-full cursor-pointer"
              onClick={() => handleScroll("right")}
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {layout === "carousel" ? (
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-3"
          style={{ scrollbarWidth: "none" }}
        >
          {section.items.map((item) => (
            <div key={item.id} className="shrink-0 w-72">
              <FeaturedSectionCard item={item} />
            </div>
          ))}
        </div>
      ) : (
        <div
          className={
            layout === "list"
              ? "flex flex-col gap-3"
              : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          }
        >
          {section.items.map((item) => (
            <div key={item.id}>
              <FeaturedSectionCard item={item} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
};
