"use client";

import { useEffect, useRef } from "react";
import { useSearchBar } from "@/hooks/use-search-bar";
import { SearchInput } from "./search/search-input";
import { SearchResults } from "./search/search-results";
import { SearchScopeTabs } from "./search/search-scope-tabs";

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
    handleSelectCategory,
    handleSelectRecording,
    handleSelectMaterial,
  } = useSearchBar();

  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setShowDropdown]);

  return (
    <div ref={containerRef} className="relative w-full max-w-lg flex flex-col">
      <SearchInput
        term={term}
        onChange={(val) => {
          setTerm(val);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
        searching={searching}
      />

      {/* Dropdown */}
      {showDropdown && (term.trim() !== "" || currentCategory) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border shadow-xl rounded-xl overflow-hidden z-50 flex flex-col max-h-[420px]">
          {currentCategory && (
            <SearchScopeTabs
              scope={scope}
              setScope={setScope}
              currentCategory={currentCategory}
            />
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
        </div>
      )}
    </div>
  );
}
