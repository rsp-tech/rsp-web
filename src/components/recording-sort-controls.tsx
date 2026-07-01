"use client";

import {
  ArrowDown,
  ArrowDownZA,
  ArrowUp,
  ArrowUpAZ,
  CalendarArrowDown,
  CalendarArrowUp,
} from "lucide-react";
import { SearchableSelect } from "@/components/search/searchable-select";
import { Button } from "./ui/button";
import { Label } from "./ui/label";

export type SortOption = "order_ind" | "name" | "date";

interface RecordingSortControlsProps {
  sortBy: SortOption;
  setSortBy: (sortBy: SortOption) => void;
  sortOrder: "asc" | "desc";
  setSortOrder: (sortOrder: "asc" | "desc") => void;
  totalCount: number;
}

export function RecordingSortControls({
  sortBy,
  setSortBy,
  sortOrder,
  setSortOrder,
  totalCount,
}: RecordingSortControlsProps) {
  let UpArrow = ArrowUp;
  let DownArrow = ArrowDown;
  if (sortBy === "name") {
    UpArrow = ArrowUpAZ;
    DownArrow = ArrowDownZA;
  } else if (sortBy === "date") {
    UpArrow = CalendarArrowUp;
    DownArrow = CalendarArrowDown;
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-border/40 mb-2">
      <span className="text-xs font-semibold text-muted-foreground">
        {totalCount} {totalCount === 1 ? "recording" : "recordings"} found
      </span>

      <div className="flex items-center gap-3">
        <Label className="text-muted-foreground font-bold">Sort by:</Label>
        <SearchableSelect
          options={[
            { value: "order_ind", label: "Default" },
            { value: "name", label: "By Name" },
            { value: "date", label: "By Date" },
          ]}
          value={sortBy}
          onChange={(value) => setSortBy(value as SortOption)}
          placeholder="Sort by"
          className="w-32"
        />

        <Button
          type="button"
          onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
          title={sortOrder === "asc" ? "Ascending" : "Descending"}
          variant="outline"
        >
          {sortOrder === "asc" ? (
            <UpArrow className="size-4" />
          ) : (
            <DownArrow className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
}
