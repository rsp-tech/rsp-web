"use client";

import { Loader2, Search, X } from "lucide-react";
import type { ComponentProps } from "react";

interface SearchInputProps extends Omit<ComponentProps<"input">, "onChange"> {
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
    <div className="relative flex items-center bg-muted border border-border rounded-xl px-3 py-1.5 focus-within:ring-1 focus-within:ring-primary focus-within:border-primary transition-all">
      <Search className="w-4 h-4 text-muted-foreground mr-2 shrink-0" />
      <input
        type="text"
        value={term}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        placeholder={placeholder}
        className="w-full bg-transparent border-none outline-none text-sm text-foreground placeholder-muted-foreground"
        {...props}
      />
      {term && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="p-0.5 hover:bg-muted-foreground/10 rounded-md transition-colors mr-1"
          aria-label="Clear search"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      )}
      {searching && (
        <Loader2 className="w-4 h-4 text-primary animate-spin shrink-0 ml-1" />
      )}
    </div>
  );
}
