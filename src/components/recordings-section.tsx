"use client";

import { Music } from "lucide-react";
import { useMemo, useState } from "react";
import { sortByDate, sortByOrderInd } from "@/lib/utils";
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
    const order = sortOrder === "asc" ? 1 : -1;
    switch (sortBy) {
      case "name":
        return recordings.toSorted(
          (a, b) => order * (a.name || "").localeCompare(b.name || ""),
        );
      case "date":
        return recordings.toSorted(
          sortByDate(order, "created_at" as keyof EnrichedRecording),
        );
      case "order_ind":
        return recordings.toSorted(sortByOrderInd(order));
    }
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
