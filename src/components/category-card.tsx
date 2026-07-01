import Link from "next/link";
import { getCategoryImageUrl } from "@/lib/storage";
import { categoryPath } from "@/lib/utils";
import type { Category } from "@/types";

interface CategoryCardProps {
  cat: Category;
  onKeyDown?: React.KeyboardEventHandler<HTMLAnchorElement>;
  priority?: boolean;
}

export const CategoryCard = ({
  cat,
  onKeyDown,
  priority,
}: CategoryCardProps) => {
  const imgUrl = getCategoryImageUrl(cat);
  const avifUrl = imgUrl?.replace(".webp", ".avif");
  const href = `/${categoryPath(cat.url_path)}`;

  return (
    <Link
      href={href}
      onKeyDown={onKeyDown}
      data-category-item
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-md hover:shadow-md focus:ring-1 focus:ring-primary focus:outline-hidden transition-all duration-200 active:scale-98 cursor-pointer"
      style={{ height: "15rem" }}
    >
      {imgUrl ? (
        <div className="absolute inset-0 w-full h-full bg-muted">
          <picture>
            <source srcSet={avifUrl} type="image/avif" />
            <img
              src={imgUrl}
              alt=""
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : undefined}
              onError={(e) => {
                // Structural native fallback allocation
                e.currentTarget.src = "/rsp.webp";
              }}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-125 transition-all duration-200"
            />
          </picture>
        </div>
      ) : (
        <div className="absolute inset-0 bg-linear-to-r from-primary/20 via-primary/5 to-transparent" />
      )}
      <div className="absolute inset-0 bg-linear-to-r from-primary/20 via-primary/5 to-transparent" />

      <div className="relative mt-auto gap-1 flex flex-col items-center bg-black/10 backdrop-blur-xs">
        <h3 className="text-lg font-bold font-heading text-white transition-all line-clamp-2">
          {cat.name}
        </h3>
      </div>
    </Link>
  );
};
