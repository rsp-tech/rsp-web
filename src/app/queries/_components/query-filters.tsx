"use client";

import { Search } from "lucide-react";
import { SearchableSelect } from "@/components/search/searchable-select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QUERY_CATEGORIES } from "@/constants";

const CATEGORY_OPTIONS = [
  { value: "all", label: "All Categories" },
  ...QUERY_CATEGORIES,
];

interface QueryFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  categoryFilter: string;
  onCategoryChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  totalMatches: number;
}

export const QueryFilters = ({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  totalMatches: _totalMatches,
}: QueryFiltersProps) => {
  return (
    <div className="flex flex-col gap-2.5">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground opacity-60" />
        <Input
          type="text"
          id="search-queries"
          placeholder="Search tickets..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9 text-xs"
        />
      </div>

      {/* Category Select */}
      <SearchableSelect
        options={CATEGORY_OPTIONS}
        value={categoryFilter}
        onChange={onCategoryChange}
        placeholder="All Categories"
        className="h-9 bg-card cursor-pointer text-xs"
      />

      {/* Tabs for Ticket State (All, Active, Closed) */}
      <Tabs
        defaultValue="all"
        value={statusFilter}
        onValueChange={onStatusChange}
        className="w-full"
      >
        <TabsList
          className="grid w-full"
          style={{ gridTemplateColumns: "repeat(3, minmax(0, 1fr))" }}
        >
          <TabsTrigger
            type="button"
            value="all"
            className="cursor-pointer text-xs"
          >
            All
          </TabsTrigger>
          <TabsTrigger
            type="button"
            value="active"
            className="cursor-pointer text-xs"
          >
            Active
          </TabsTrigger>
          <TabsTrigger
            type="button"
            value="closed"
            className="cursor-pointer text-xs"
          >
            Closed
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};
