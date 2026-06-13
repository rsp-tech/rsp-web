"use client";

import { CornerDownRight, Folder, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Category } from "@/types";
import type { SearchScope } from "../search-bar";

interface SearchScopeTabsProps {
  scope: SearchScope;
  setScope: (scope: SearchScope) => void;
  currentCategory: Category;
}

export function SearchScopeTabs({
  scope,
  setScope,
  currentCategory,
}: SearchScopeTabsProps) {
  return (
    <div className="flex border-b border-border bg-muted/40 p-1 gap-1 text-xs">
      <Button
        type="button"
        variant={scope === "full" ? "secondary" : "ghost"}
        size="xs"
        onClick={() => setScope("full")}
        className="flex-1"
      >
        <Globe className="w-3.5 h-3.5" /> Full Search
      </Button>
      <Button
        type="button"
        variant={scope === "current" ? "secondary" : "ghost"}
        size="xs"
        onClick={() => setScope("current")}
        className="flex-grow"
        title={`Search directly under ${currentCategory.name}`}
      >
        <Folder className="w-3.5 h-3.5" /> Current Page
      </Button>
      <Button
        type="button"
        variant={scope === "sub" ? "secondary" : "ghost"}
        size="xs"
        onClick={() => setScope("sub")}
        className="flex-grow"
        title={`Search under ${currentCategory.name} and its sub-categories`}
      >
        <CornerDownRight className="w-3.5 h-3.5" /> Sub-categories
      </Button>
    </div>
  );
}
