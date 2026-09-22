import { ChevronRight, Home } from "lucide-react";
import Link from "next/link";

interface Breadcrumb {
  label: string;
  href: string;
}

export const CategoryBreadcrumbs = ({
  breadcrumbs,
}: {
  breadcrumbs: Breadcrumb[];
}) => {
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
            className={`hover:transition-all ${
              idx === breadcrumbs.length - 1 ? "font-bold" : ""
            }`}
          >
            {crumb.label}
          </Link>
        </div>
      ))}
    </nav>
  );
};
