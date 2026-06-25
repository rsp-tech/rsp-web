"use client";

import { Loader2, Search, X } from "lucide-react";
import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";

interface SearchInputProps
  extends Omit<ComponentProps<typeof Input>, "onChange"> {
  term: string;
  onChange: (value: string) => void;
  searching: boolean;
}

export function SearchInput({
  term,
  onChange,
  searching,
  onFocus,
  placeholder = "Search discourses, recordings, categories...",
  className,
  ...props
}: SearchInputProps) {
  return (
    <div className="relative flex items-center w-full">
      <Search className="absolute left-3 w-4 h-4 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        value={term}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className="pl-9 pr-16 h-9 w-full bg-muted border-border focus-visible:border-primary focus-visible:ring-1 focus-visible:ring-primary focus-visible:ring-offset-0"
        {...props}
      />
      <div className="absolute right-3 flex items-center gap-1.5">
        {term && (
          <button
            type="button"
            onClick={() => onChange("")}
            className="p-0.5 hover:bg-muted-foreground/10 rounded-md transition-colors cursor-pointer"
            aria-label="Clear search"
          >
            <X className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        )}
        {searching && (
          <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0" />
        )}
      </div>
    </div>
  );
}
