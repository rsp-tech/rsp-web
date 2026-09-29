import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";
import { useCategories } from "@/hooks/use-categories";
import { categoryPath, cn } from "@/lib/utils";
import type { Category } from "@/types";

interface CategoryBreadcrumbsProps {
  category?: Category;
}

export const CategoryBreadcrumbs = ({ category }: CategoryBreadcrumbsProps) => {
  const { data: categories } = useCategories();

  const slugCategories = (category?.path.split(".") ?? [])
    .map((id) => categories?.find((c) => c.id === Number(id)))
    .concat(category)
    .filter(Boolean);

  const breadcrumbs = [
    { label: "Library", href: "/library" },
    ...slugCategories.map((cat) => ({
      label: cat?.name,
      href: categoryPath(cat?.url_path ?? ""),
    })),
  ];

  const handleCrumbClick =
    (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      window.history.pushState(null, "", href);
      window.scrollTo({ top: 0, behavior: "instant" });
    };

  return (
    <nav className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground opacity-80 overflow-x-auto whitespace-nowrap py-1">
      <Link
        href="/"
        className="hover:transition-all flex items-center gap-1"
        prefetch={false}
      >
        <Home className="w-3 h-3" />
        <span>Home</span>
      </Link>
      {breadcrumbs.map((crumb, idx) => (
        <div key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3 text-muted-foreground opacity-60 shrink-0" />
          <Link
            prefetch={false}
            href={crumb.href}
            onClick={handleCrumbClick(crumb.href)}
            className={cn(
              "hover:transition-all",
              idx === breadcrumbs.length - 1 ? "font-bold" : "",
            )}
          >
            {crumb.label}
          </Link>
        </div>
      ))}
    </nav>
  );
};
