"use client";

import { SlidersHorizontal } from "lucide-react";
import dynamic from "next/dynamic";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverAnchor } from "@/components/ui/popover";
import { useSearchBar } from "@/hooks/use-search-bar";
import { SearchInput } from "./search/search-input";

export type SearchScope = "full" | "current" | "sub";

const SearchBarDropdownContent = dynamic(
  () =>
    import("./search-bar-dropdown").then((mod) => mod.SearchBarDropdownContent),
  { ssr: false },
);

export function SearchBar() {
  const searchBarState = useSearchBar();
  const { term, setTerm, searching, showDropdown, setShowDropdown, filters } =
    searchBarState;

  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters =
    (filters.speaker_ids && filters.speaker_ids.length > 0) ||
    (filters.lang_ids && filters.lang_ids.length > 0) ||
    filters.venues_id !== undefined ||
    filters.date_start !== "" ||
    filters.date_end !== "";

  return (
    <div className="relative w-full max-w-lg">
      <Popover open={showDropdown} onOpenChange={setShowDropdown}>
        <PopoverAnchor asChild>
          <div className="flex gap-2 items-center w-full">
            <SearchInput
              term={term}
              onChange={setTerm}
              onFocus={() => setShowDropdown(true)}
              searching={searching}
              role="combobox"
              aria-expanded={showDropdown}
              aria-haspopup="dialog"
            />
            {(term.trim() !== "" || showDropdown) && (
              <Button
                id="search-filters-toggle"
                type="button"
                variant={showFilters ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="h-9 shrink-0 gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3 h-3" />
                <span className="hidden sm:inline">Filters</span>
                {hasActiveFilters && (
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                )}
              </Button>
            )}
          </div>
        </PopoverAnchor>

        {/* Dropdown content */}
        {showDropdown && (
          <SearchBarDropdownContent
            showFilters={showFilters}
            hasActiveFilters={hasActiveFilters}
            {...searchBarState}
          />
        )}
      </Popover>
    </div>
  );
}
