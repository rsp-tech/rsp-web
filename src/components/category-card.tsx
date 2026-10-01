"use client";

import Link from "next/link";
import { useState } from "react";
import { getCategoryImageUrl } from "@/lib/storage";
import { categoryPath, navigateClientSide } from "@/lib/utils";
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
  const imgUrl = getCategoryImageUrl(cat, "webp");
  const avifUrl = getCategoryImageUrl(cat, "avif");
  const href = categoryPath(cat.url_path);
  const [failed, setFailed] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    navigateClientSide(href, e);
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      onKeyDown={onKeyDown}
      prefetch={false}
      data-category-item
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-md hover:shadow-md focus:ring-1 focus:ring-primary focus:outline-none transition-all duration-200 active:scale-98 cursor-pointer"
      style={{ height: "15rem" }}
    >
      {imgUrl ? (
        <div className="absolute inset-0 w-full h-full bg-muted">
          <picture>
            {!failed && <source srcSet={avifUrl} type="image/avif" />}
            <img
              src={imgUrl}
              alt=""
              loading={priority ? "eager" : "lazy"}
              fetchPriority={priority ? "high" : undefined}
              onError={(e) => {
                const img = e.currentTarget;
                setFailed(true);
                if (img.src.endsWith("/rsp.webp")) {
                  img.onerror = null;
                  return;
                }
                // Structural native fallback allocation
                img.src = "/rsp.webp";
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
