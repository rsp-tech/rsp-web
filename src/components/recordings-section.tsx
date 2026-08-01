"use client";

import { Music } from "lucide-react";
import { useMemo, useState } from "react";
import type { EnrichedRecording } from "@/types";
import { RecordingCards } from "./recording-cards";
import {
  RecordingSortControls,
  type SortOption,
} from "./recording-sort-controls";

interface RecordingListProps {
  recordings: EnrichedRecording[];
}

export const RecordingsSection = ({ recordings }: RecordingListProps) => {
  "use no memo";
  const [sortBy, setSortBy] = useState<SortOption>("order_ind");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const sortedRecordings = useMemo(() => {
    return [...recordings].sort((a, b) => {
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
        result = orderB - orderA; // default reverse sorted
      }
      return sortOrder === "asc" ? result : -result;
    });
  }, [recordings, sortBy, sortOrder]);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-xl font-bold font-heading flex items-center gap-2">
        <Music className="w-5 h-5 text-primary" />
        Discourses & Recordings
      </h2>
      <div className="flex flex-col gap-4">
        <RecordingSortControls
          sortBy={sortBy}
          setSortBy={setSortBy}
          sortOrder={sortOrder}
          setSortOrder={setSortOrder}
          totalCount={recordings.length}
        />

        <RecordingCards {...{ sortedRecordings }} />
      </div>
    </section>
  );
};
