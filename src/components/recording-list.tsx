"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { EnrichedRecording } from "@/types";
import { RecordingCard } from "./recording-card";
import {
  RecordingSortControls,
  type SortOption,
} from "./recording-sort-controls";

interface RecordingListProps {
  recordings: EnrichedRecording[];
  isPending?: boolean;
}

export const RecordingList = ({
  recordings,
  isPending,
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

  return recordings.length === 0 ? (
    <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
      No recordings in this category yet.
    </div>
  ) : (
    <div className="flex flex-col gap-4">
      <RecordingSortControls
        sortBy={sortBy}
        setSortBy={setSortBy}
        sortOrder={sortOrder}
        setSortOrder={setSortOrder}
        totalCount={recordings.length}
      />

      {sortedRecordings.map((rec) => (
        <RecordingCard
          key={rec.id}
          rec={rec}
          q={q}
          m={m}
          onKeyDown={handleRecordingKeyDown}
        />
      ))}
    </div>
  );
};
