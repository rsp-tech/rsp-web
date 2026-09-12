import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { BannerControlsProps } from "./banner-types";

export const BannerControls = ({
  total,
  currentIndex,
  onPrev,
  onNext,
  onSelect,
  onDismiss,
}: BannerControlsProps) => {
  return (
    <>
      {total > 1 && (
        <>
          <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-white cursor-pointer"
              style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
              onClick={onPrev}
              aria-label="Previous announcement"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>

          <div
            className="absolute top-1/2 -translate-y-1/2 z-10 opacity-0 group-hover:opacity-100"
            style={{ right: "2.25rem" }}
          >
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-full text-white cursor-pointer"
              style={{ backgroundColor: "rgba(0,0,0,0.35)" }}
              onClick={onNext}
              aria-label="Next announcement"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Dots Indicator */}
          <div
            className="absolute left-1/2 -translate-x-1/2 z-10 flex items-center gap-1"
            style={{ bottom: "0.25rem" }}
          >
            {Array.from({ length: total }, (_, idx) => (
              <button
                // biome-ignore lint/suspicious/noArrayIndexKey: Pagination dot indices
                key={idx}
                type="button"
                onClick={() => onSelect(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className="rounded-full transition-all cursor-pointer"
                style={{
                  height: "0.25rem",
                  width: idx === currentIndex ? "1rem" : "0.25rem",
                  backgroundColor:
                    idx === currentIndex ? "#ffffff" : "rgba(255,255,255,0.4)",
                  transitionDuration: "300ms",
                }}
              />
            ))}
          </div>
        </>
      )}

      {/* Dismiss Button */}
      <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10">
        <Button
          size="icon"
          variant="ghost"
          className="h-8 w-8 rounded-full text-white cursor-pointer"
          style={{ backgroundColor: "rgba(0,0,0,0.25)" }}
          onClick={onDismiss}
          aria-label="Dismiss banner for session"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </>
  );
};
