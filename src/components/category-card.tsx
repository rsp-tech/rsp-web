import Link from "next/link";
import { getCategoryImageUrl } from "@/lib/storage";
import { categoryPath } from "@/lib/utils";
import type { Category } from "@/types";

interface CategoryCardProps {
  cat: Category;
}

export const CategoryCard = ({ cat }: CategoryCardProps) => {
  const imgUrl = getCategoryImageUrl(cat);
  const href = `/${categoryPath(cat.url_path)}`;

  return (
    <Link
      href={href}
      className={`group relative flex flex-col overflow-hidden rounded-2xl h-48 border border-border bg-card shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 cursor-pointer`}
    >
      {imgUrl ? (
        <img
          src={imgUrl}
          alt={cat.name}
          className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
      ) : (
        <div
          className={`absolute inset-0 bg-linear-to-tr from-primary/20 via-primary/5 to-transparent`}
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

      <div className={`relative mt-auto p-5 gap-1 flex flex-col`}>
        <h3
          className={`text-lg font-bold font-heading text-white group-hover:text-primary-foreground transition-colors line-clamp-2`}
        >
          {cat.name}
        </h3>
      </div>
    </Link>
  );
};
