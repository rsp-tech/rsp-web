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
  return (
    <nav className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground opacity-80 overflow-x-auto whitespace-nowrap py-1">
      <Link
        href="/"
        className="hover:text-foreground transition-colors flex items-center gap-1"
      >
        <Home className="w-3.5 h-3.5" />
        <span>Home</span>
      </Link>
      {breadcrumbs.map((crumb, idx) => (
        <div key={crumb.href} className="flex items-center gap-1.5">
          <ChevronRight className="w-3 h-3 text-muted-foreground opacity-60 shrink-0" />
          <Link
            href={crumb.href}
            className={`hover:text-foreground transition-colors ${
              idx === breadcrumbs.length - 1 ? "text-foreground font-bold" : ""
            }`}
          >
            {crumb.label}
          </Link>
        </div>
      ))}
    </nav>
  );
};
