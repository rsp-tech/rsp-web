import { useSearchParams } from "next/navigation";
import { useEffect, useMemo } from "react";
import type { EnrichedRecording } from "@/types";
import { RecordingCard } from "./recording-card";

export interface RecordingCardsProps {
  sortedRecordings: EnrichedRecording[];
}

const STAGGER_START_OFFSET = 10;
const MAX_ANIMATED_ITEMS = 30;
const STAGGER_MULTIPLIER = 40;
const MAX_DELAY_MS = 250;

// Keyboard navigation for recordings
const handleRecordingKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
  const recs = Array.from(
    document.querySelectorAll<HTMLElement>("[data-recording-item]"),
  );
  const index = recs.indexOf(e.currentTarget);
  if (index === -1) return;

  if (e.key === "ArrowDown") {
    e.preventDefault();
    recs[(index + 1) % recs.length]?.focus();
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    recs[(index - 1 + recs.length) % recs.length]?.focus();
  }
};

export const RecordingCards = ({ sortedRecordings }: RecordingCardsProps) => {
  const searchParams = useSearchParams();

  const q = searchParams.get("q");
  const m = searchParams.get("m");

  const [animationStartIndex, animationEndIndex] = useMemo(() => {
    const targetRecId = Number(q);
    const targetIndex = sortedRecordings.findIndex((r) => r.id === targetRecId);
    const animationStartIndex =
      targetIndex === -1 ? 0 : Math.max(0, targetIndex - STAGGER_START_OFFSET);
    return [animationStartIndex, animationStartIndex + MAX_ANIMATED_ITEMS];
  }, [sortedRecordings, q]);

  useEffect(() => {
    if (!q) return;

    const timer = setTimeout(() => {
      const element = document.getElementById(`recording-${q}`);

      if (!element) return;

      element.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      element.focus();
    }, 150);

    return () => clearTimeout(timer);
  }, [q]);

  return sortedRecordings.map((rec, idx) => {
    const shouldAnimate = idx >= animationStartIndex && idx < animationEndIndex;

    return (
      <div
        id={`recording-${rec.id}`}
        key={rec.id}
        className={shouldAnimate ? "opacity-0" : undefined}
        style={
          shouldAnimate
            ? {
                animation:
                  "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
                animationDelay: `${Math.min(
                  Math.sqrt(idx - animationStartIndex) * STAGGER_MULTIPLIER,
                  MAX_DELAY_MS,
                )}ms`,
              }
            : undefined
        }
      >
        <RecordingCard {...{ rec, q, m }} onKeyDown={handleRecordingKeyDown} />
      </div>
    );
  });
};
