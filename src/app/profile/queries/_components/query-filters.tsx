"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

export function QueryFilters({
  searchTerm,
  onSearchChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
  totalMatches,
}: QueryFiltersProps) {
  return (
    <div className="flex flex-col gap-6">
      {/* Controls Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="flex flex-col gap-1.5 md:col-span-2">
          <Label
            htmlFor="search-queries"
            className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
          >
            Search Tickets
          </Label>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground opacity-60" />
            <Input
              type="text"
              id="search-queries"
              placeholder="Search subject or message content..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label
            htmlFor="filter-category"
            className="text-xs font-bold text-muted-foreground uppercase tracking-wider"
          >
            Topic Category
          </Label>
          <Select value={categoryFilter} onValueChange={onCategoryChange}>
            <SelectTrigger
              id="filter-category"
              className="h-9 w-full bg-card border-border text-foreground cursor-pointer"
            >
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="w-full border-t border-border my-2" />

      {/* Tabs for Ticket State (All, Active, Closed) */}
      <div className="flex items-center justify-between gap-4 mb-2">
        <Tabs
          defaultValue="all"
          value={statusFilter}
          onValueChange={onStatusChange}
          className="w-xs"
        >
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger type="button" value="all" className="cursor-pointer">
              All
            </TabsTrigger>
            <TabsTrigger
              type="button"
              value="active"
              className="cursor-pointer"
            >
              Active
            </TabsTrigger>
            <TabsTrigger
              type="button"
              value="closed"
              className="cursor-pointer"
            >
              Closed
            </TabsTrigger>
          </TabsList>
        </Tabs>
        <span className="text-xs font-semibold text-muted-foreground">
          Matches found:{" "}
          <span className="text-foreground font-bold">{totalMatches}</span>
        </span>
      </div>
    </div>
  );
}
