import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import type { EnrichedRecording } from "@/types";
import { RecordingCard } from "./recording-card";

export interface RecordingCardsProps {
  sortedRecordings: EnrichedRecording[];
}

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

export const RecordingCards = ({ sortedRecordings }: RecordingCardsProps) => {
  const searchParams = useSearchParams();

  const q = searchParams.get("q");
  const m = searchParams.get("m");

  // Autoscroll to selected recording via TanStack Virtualizer index scroll
  useEffect(() => {
    if (q) {
      // Delay slightly to allow rendering to complete
      const timer = setTimeout(() => {
        const element = document.getElementById(`recording-${q}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [q]);

  return sortedRecordings.map((rec, idx) => (
    <div
      id={`recording-${rec.id}`}
      key={rec.id}
      className="opacity-0"
      style={{
        animation: "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        animationDelay: `${idx * 50}ms`,
      }}
    >
      <RecordingCard rec={rec} q={q} m={m} onKeyDown={handleRecordingKeyDown} />
    </div>
  ));
};
