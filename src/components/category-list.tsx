import { CategoryCard } from "@/components/category-card";
import { Skeleton } from "@/components/ui/skeleton";
import type { Category } from "@/types";

interface CategoryListProps {
  categories: Category[] | undefined;
  isLoading: boolean;
  error?: unknown;
  onCardKeyDown?: React.KeyboardEventHandler<HTMLAnchorElement>;
}

export const CategoryList = ({
  categories,
  isLoading,
  error,
}: CategoryListProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton
            // biome-ignore lint/suspicious/noArrayIndexKey: ok for skeleton
            key={i}
            className="h-48 rounded-2xl animate-stagger-fade-in-up"
            style={{ "--stagger-delay": `${i * 100}ms` } as React.CSSProperties}
          />
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

  if (!categories?.length) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-2xl text-sm">
        No categories available. Background sync may be running.
      </div>
    );
  }

  // Keyboard navigation for subcategories
  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>("[data-category-item]"),
    );
    const index = cards.indexOf(e.currentTarget);
    if (index === -1) return;

    if (e.key === "Tab" && !e.shiftKey) {
      const firstRec = document.querySelector<HTMLElement>(
        "[data-recording-item]",
      );
      if (firstRec) {
        e.preventDefault();
        firstRec.focus();
      }
    } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = (index + 1) % cards.length;
      cards[next]?.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (index - 1 + cards.length) % cards.length;
      cards[prev]?.focus();
    }
  };

  categories.sort((a, b) =>
    a.order_ind !== null && b.order_ind !== null
      ? a.order_ind - b.order_ind
      : 0,
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12 lg:pb-4">
      {categories.map((cat, idx) => (
        <div
          key={cat.id}
          className="animate-stagger-fade-in-up"
          style={{ "--stagger-delay": `${idx * 45}ms` } as React.CSSProperties}
        >
          <CategoryCard
            cat={cat}
            onKeyDown={handleCategoryKeyDown}
            priority={idx < 8}
          />
        </div>
      ))}
    </div>
  );
};
