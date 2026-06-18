"use client";

import { ChevronRight, FolderOpen, Home, Loader2, Music } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { use, useEffect } from "react";
import { CategoryList } from "@/components/category-list";
import { RecordingList } from "@/components/recording-list";
import { useCategoryPage } from "@/hooks/use-category-page";
import { trackEvent } from "@/lib/analytics";
import { slugToLabel } from "@/lib/utils";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = use(params);
  const { data, isPending, error } = useCategoryPage(slug);

  useEffect(() => {
    if (data?.category?.name) {
      trackEvent("category_viewed", { category_name: data.category.name });
    }
  }, [data?.category?.name]);

  if (data?.redirectTo) {
    redirect(data.redirectTo);
  }

  if (isPending) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm font-semibold text-muted-foreground">
          Loading discourses...
        </p>
      </div>
    );
  }

  if (error || !data?.category) {
    return (
      <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-medium">
        Failed to load this category. Please check your connection or path.
      </div>
    );
  }

  const { category, subcategories, recordings } = data;

  const breadcrumbs = slug.map((slugPart, index) => {
    const path = slug.slice(0, index + 1).join("/");
    return { label: slugToLabel(slugPart), href: `/${path}` };
  });

  return (
    <div className="flex flex-col gap-8 py-2">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground/80 overflow-x-auto whitespace-nowrap py-1">
        <Link
          href="/"
          className="hover:text-foreground transition-colors flex items-center gap-1"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        {breadcrumbs.map((crumb, idx) => (
          <div key={crumb.href} className="flex items-center gap-1.5">
            <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
            <Link
              href={crumb.href}
              className={`hover:text-foreground transition-colors ${
                idx === breadcrumbs.length - 1
                  ? "text-foreground font-bold"
                  : ""
              }`}
            >
              {crumb.label}
            </Link>
          </div>
        ))}
      </nav>

      {/* Category Header */}
      <div className="flex flex-col gap-2 border-b border-border pb-6">
        <span className="text-xs font-bold text-primary tracking-wider uppercase">
          Category
        </span>
        <h1 className="text-3xl sm:text-4xl font-extrabold font-heading text-foreground tracking-tight">
          {category.name}
        </h1>
      </div>

      {/* Subcategories Section */}
      {subcategories.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            Subcategories
          </h2>
          <CategoryList categories={subcategories} isLoading={false} />
        </section>
      )}

      {/* Recordings Section */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          Discourses & Recordings
        </h2>

        <RecordingList {...{ recordings, isPending, category }} />
      </section>
    </div>
  );
}
