"use client";

import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
} from "@/components/ui/popover";
import { useSearchBar } from "@/hooks/use-search-bar";
import { DateRangePicker } from "./search/date-picker";
import { SearchInput } from "./search/search-input";
import { SearchResults } from "./search/search-results";
import { SearchScopeTabs } from "./search/search-scope-tabs";
import { SearchableSelect } from "./search/searchable-select";
import { Label } from "./ui/label";

export type SearchScope = "full" | "current" | "sub";

export function SearchBar() {
  const {
    term,
    setTerm,
    scope,
    setScope,
    currentCategory,
    results,
    searching,
    showDropdown,
    setShowDropdown,
    filters,
    setFilters,
    availableSpeakers,
    availableLanguages,
    availableVenues,
    handleSelectCategory,
    handleSelectRecording,
    handleSelectMaterial,
  } = useSearchBar();

  const [showFilters, setShowFilters] = useState(false);

  const handleResetFilters = () => {
    setFilters({
      speaker_ids: [],
      lang_ids: [],
      venues_id: undefined,
      date_start: "",
      date_end: "",
    });
  };

  const hasActiveFilters =
    (filters.speaker_ids && filters.speaker_ids.length > 0) ||
    (filters.lang_ids && filters.lang_ids.length > 0) ||
    filters.venues_id !== undefined ||
    filters.date_start !== "" ||
    filters.date_end !== "";

  const speakerOptions = availableSpeakers.map((s) => ({
    value: String(s.id),
    label: s.name,
  }));

  const languageOptions = availableLanguages.map((l) => ({
    value: String(l.id),
    label: l.name === l.native_name ? l.name : `${l.name} (${l.native_name})`,
  }));

  const venueOptions = availableVenues.map((v) => ({
    value: String(v.id),
    label: v.name,
  }));

  return (
    <div className="relative w-full max-w-lg">
      <Popover open={showDropdown} onOpenChange={setShowDropdown}>
        <PopoverAnchor asChild>
          <div className="flex gap-2 items-center w-full">
            <div className="flex-1">
              <SearchInput
                term={term}
                onClick={(e) => e.stopPropagation()}
                onChange={(val) => {
                  setTerm(val);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                searching={searching}
                role="combobox"
                aria-expanded={showDropdown}
                aria-haspopup="dialog"
              />
            </div>
            {(term.trim() !== "" || showDropdown) && (
              <Button
                id="search-filters-toggle"
                type="button"
                variant={showFilters ? "secondary" : "outline"}
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFilters(!showFilters);
                  if (!showDropdown) {
                    setShowDropdown(true);
                  }
                }}
                className="h-9 shrink-0 gap-1.5 cursor-pointer"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
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
          <PopoverContent
            className="p-0 bg-card border border-border shadow-xl rounded-xl overflow-hidden z-50 flex flex-col"
            style={{
              width: "var(--radix-popover-trigger-width)",
              maxHeight: "28.75rem",
            }}
            align="start"
            onOpenAutoFocus={(e) => e.preventDefault()}
            onInteractOutside={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest("#search-filters-toggle")) {
                e.preventDefault();
              }
            }}
          >
            {currentCategory && (
              <SearchScopeTabs
                scope={scope}
                setScope={setScope}
                currentCategory={currentCategory}
              />
            )}
            {/* Collapsible Filters Panel */}
            {showFilters && (
              <div className="bg-muted/40 p-3 -mt-3 border-b border-border flex flex-col gap-2.5 text-xs">
                <div className="flex items-center justify-between pb-1 border-b border-border/40">
                  <span className="font-bold text-foreground">
                    Advanced Search Filters
                  </span>
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={handleResetFilters}
                      className="text-xxs text-primary hover:bg-accent rounded-md font-bold cursor-pointer p-2"
                    >
                      Reset Filters
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-x-3 gap-y-2">
                  {/* Speaker select */}
                  <div className="flex flex-col gap-1">
                    <Label className="text-xxs font-bold text-muted-foreground uppercase">
                      Speaker
                    </Label>
                    <SearchableSelect
                      options={speakerOptions}
                      value={
                        filters.speaker_ids?.[0]
                          ? String(filters.speaker_ids[0])
                          : ""
                      }
                      onChange={(val) => {
                        setFilters({
                          ...filters,
                          speaker_ids: val ? [Number(val)] : [],
                        });
                      }}
                      placeholder="All Speakers"
                    />
                  </div>

                  {/* Language select */}
                  <div className="flex flex-col gap-1">
                    <Label className="text-xxs font-bold text-muted-foreground uppercase">
                      Language
                    </Label>
                    <SearchableSelect
                      options={languageOptions}
                      value={
                        filters.lang_ids?.[0] ? String(filters.lang_ids[0]) : ""
                      }
                      onChange={(val) => {
                        setFilters({
                          ...filters,
                          lang_ids: val ? [Number(val)] : [],
                        });
                      }}
                      placeholder="All Languages"
                    />
                  </div>

                  {/* Venue select */}
                  <div className="flex flex-col gap-1">
                    <Label className="text-xxs font-bold text-muted-foreground uppercase">
                      Venue
                    </Label>
                    <SearchableSelect
                      options={venueOptions}
                      value={filters.venues_id ? String(filters.venues_id) : ""}
                      onChange={(val) => {
                        setFilters({
                          ...filters,
                          venues_id: val ? Number(val) : undefined,
                        });
                      }}
                      placeholder="All Venues"
                    />
                  </div>

                  {/* Date range inputs */}
                  <div className="flex flex-col gap-1">
                    <Label className="text-xxs font-bold text-muted-foreground uppercase">
                      Recorded Date Range
                    </Label>
                    <DateRangePicker
                      startDate={filters.date_start || ""}
                      endDate={filters.date_end || ""}
                      onChange={(start, end) => {
                        setFilters({
                          ...filters,
                          date_start: start,
                        });
                        // Only update end date if start is also present (or both empty)
                        if (start || (!start && !end)) {
                          setFilters((prev) => ({
                            ...prev,
                            date_start: start,
                            date_end: end,
                          }));
                        }
                      }}
                      placeholder="Select range"
                    />
                  </div>
                </div>
              </div>
            )}
            <SearchResults
              categories={results.categories}
              recordings={results.recordings}
              materials={results.materials}
              onSelectCategory={handleSelectCategory}
              onSelectRecording={handleSelectRecording}
              onSelectMaterial={handleSelectMaterial}
              term={term}
              hasCategoryContext={!!currentCategory}
            />
          </PopoverContent>
        )}
      </Popover>
    </div>
  );
}
