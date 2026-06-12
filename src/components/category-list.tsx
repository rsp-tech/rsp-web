import { CategoryCard } from "@/components/category-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category } from "@/types";

interface CategoryListProps {
  categories: Category[] | undefined;
  isLoading: boolean;
  error?: unknown;
}

export const CategoryList = ({
  categories,
  isLoading,
  error,
}: CategoryListProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: ok for skeleton
          <Skeleton key={i} className="h-48 rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-medium">
        Could not load categories. Please try refreshing.
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-2xl text-sm">
        No categories available. Background sync may be running.
      </div>
    );
  }

  categories.sort((a, b) =>
    a.order_ind !== null && b.order_ind !== null
      ? a.order_ind - b.order_ind
      : 0,
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
      {categories.map((cat) => (
        <CategoryCard key={cat.id} cat={cat} />
      ))}
    </div>
  );
};
