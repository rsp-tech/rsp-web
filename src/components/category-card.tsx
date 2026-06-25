import Link from "next/link";
import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { getCategoryImageUrl } from "@/lib/storage";
import { categoryPath, cn } from "@/lib/utils";
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
  const [isLoaded, setIsLoaded] = useState(false);
  const [isError, setIsError] = useState(false);
  const imgUrl = getCategoryImageUrl(cat);
  const href = `/${categoryPath(cat.url_path)}`;

  return (
    <Link
      href={href}
      onKeyDown={onKeyDown}
      data-category-item
      className="group relative flex flex-col overflow-hidden rounded-2xl h-60 border border-border bg-card shadow-sm hover:shadow-md hover:-translate-y-1 focus:ring-2 focus:ring-primary focus:outline-hidden transition-all duration-300 active:scale-98 cursor-pointer"
    >
      {imgUrl ? (
        <>
          {!isLoaded && (
            <Skeleton className="absolute inset-0 w-full h-full rounded-none" />
          )}
          <img
            src={isError ? "/rsp.webp" : imgUrl}
            alt=""
            loading={priority ? "eager" : "lazy"}
            fetchPriority={priority ? "high" : undefined}
            onLoad={() => setIsLoaded(true)}
            onError={() => setIsError(true)}
            className={cn(
              "absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500",
              isLoaded ? "opacity-100" : "opacity-0",
            )}
          />
        </>
      ) : (
        <div className="absolute inset-0 bg-linear-to-tr from-primary/20 via-primary/5 to-transparent" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

      <div className="relative mt-auto p-5 gap-1 flex flex-col">
        <h3 className="text-lg font-bold font-heading text-white group-hover:text-primary-foreground transition-colors line-clamp-2">
          {cat.name}
        </h3>
      </div>
    </Link>
  );
};
