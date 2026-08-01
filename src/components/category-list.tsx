import { CategoryCard } from "@/components/category-card";
import { sortByOrderInd } from "@/lib/utils";
import type { Category } from "@/types";

interface CategoryListProps {
  categories: Category[] | undefined;
  onCardKeyDown?: React.KeyboardEventHandler<HTMLAnchorElement>;
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

export const CategoryList = ({ categories }: CategoryListProps) => {
  if (!categories?.length) {
    return (
      <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-2xl text-sm">
        No categories available. Background sync may be running.
      </div>
    );
  }

  categories.sort(sortByOrderInd());

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 lg:gap-12 lg:pb-4">
      {categories.map((cat, idx) => (
        <div
          key={cat.id}
          className="opacity-0"
          style={{
            animation: "fadeInUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            animationDelay: `${idx * 50}ms`,
          }}
        >
          <CategoryCard
            cat={cat}
            onKeyDown={handleCategoryKeyDown}
            priority={idx < 3}
          />
        </div>
      ))}
    </div>
  );
};
