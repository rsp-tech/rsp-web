"use client";

import { CornerDownRight, Folder, Globe } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    <Tabs
      value={scope}
      onValueChange={(val) => setScope(val as SearchScope)}
      className="w-full"
    >
      <TabsList
        className="w-full flex border-b border-border bg-muted/40 p-1 h-9"
        style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }}
      >
        <TabsTrigger value="full" className="flex-1 gap-1.5 text-xs py-1">
          <Globe className="w-3.5 h-3.5" /> Full Search
        </TabsTrigger>
        <TabsTrigger
          value="current"
          className="flex-1 gap-1.5 text-xs py-1 truncate"
          title={`Search directly under ${currentCategory.name}`}
        >
          <Folder className="w-3.5 h-3.5" /> Current Page
        </TabsTrigger>
        <TabsTrigger
          value="sub"
          className="flex-1 gap-1.5 text-xs py-1 truncate"
          title={`Search under ${currentCategory.name} and sub-categories`}
        >
          <CornerDownRight className="w-3.5 h-3.5" /> Sub-categories
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
