"use client";

import {
  BookOpen,
  ChevronRight,
  Compass,
  FolderOpen,
  Home,
  Music,
} from "lucide-react";
import Link from "next/link";
import { redirect, usePathname } from "next/navigation";
import { useEffect } from "react";
import { CategoryList } from "@/components/category-list";
import { Loading } from "@/components/loading";
import { RecordingList } from "@/components/recording-list";
import {
  type CategoryPageData,
  useCategoryPage,
} from "@/hooks/use-category-page";
import { trackEvent } from "@/lib/analytics";
import { slugToLabel } from "@/lib/utils";

export const ClientShell = ({
  initialData,
}: {
  initialData?: CategoryPageData;
}) => {
  const pathname = usePathname();
  const slug = pathname.split("/").filter(Boolean);
  const { data, isPending, error } = useCategoryPage(slug, initialData);

  useEffect(() => {
    if (data?.category?.name) {
      trackEvent("category_viewed", { category_name: data.category.name });
    }
  }, [data?.category?.name]);

  if (data?.redirectTo) {
    redirect(data.redirectTo);
  }

  if (isPending) {
    return <Loading message="Loading discourses..." />;
  }

  if (slug.length === 0) {
    return (
      <div className="flex flex-col gap-10 py-4">
        {/* Premium Hero Section */}
        <section className="relative rounded-3xl bg-linear-to-r from-primary/10 via-primary/5 to-transparent border border-primary/10 p-8 sm:p-12 overflow-hidden flex flex-col gap-4">
          <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 pointer-events-none hidden md:block">
            <Compass className="w-full h-full text-primary" />
          </div>
          <div className="flex items-center gap-2 text-primary font-bold text-xs tracking-wider uppercase">
            <BookOpen className="w-4 h-4" />
            <span>Vedic Wisdom Online</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-black font-heading tracking-tight max-w-2xl text-foreground leading-tight">
            Spiritual Discourses by{" "}
            <span className="text-primary">HG Radheshyamdas</span>
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-lg leading-relaxed font-medium">
            Explore a rich treasury of spiritual lectures, deep commentaries on
            scriptures, and wisdom to guide your daily life.
          </p>
        </section>

        {/* Root Categories Section */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold font-heading text-foreground">
              Explore Categories
            </h2>
          </div>

          <CategoryList
            categories={data?.subcategories.filter(
              (c) => c.url_path !== "trash",
            )}
            isLoading={isPending}
            error={error}
          />
        </section>
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
      {recordings.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Discourses & Recordings
          </h2>
          <RecordingList {...{ recordings, isPending, category }} />
        </section>
      )}
    </div>
  );
};
