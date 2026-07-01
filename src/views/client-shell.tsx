"use client";

import { FolderOpen, Music } from "lucide-react";
import { redirect, usePathname } from "next/navigation";
import { useEffect } from "react";
import { CategoryList } from "@/components/category-list";
import { Loading } from "@/components/loading";
import { NotFoundState } from "@/components/not-found-state";
import { RecordingList } from "@/components/recording-list";
import {
  type CategoryPageData,
  useCategoryPage,
} from "@/hooks/use-category-page";
import { trackEvent } from "@/lib/analytics";
import { slugToLabel } from "@/lib/utils";
import { CategoryBreadcrumbs } from "./_components/category-breadcrumbs";
import { CategoryHero } from "./_components/category-hero";

export const ClientShell = ({
  initialData,
}: {
  initialData?: CategoryPageData;
}) => {
  const pathname = usePathname();
  const slug = pathname.split("/").filter(Boolean);
  const { data, isPending, error, refetch } = useCategoryPage(
    slug,
    initialData,
  );

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
      <div className="flex flex-col py-4" style={{ gap: "2.5rem" }}>
        <CategoryHero />

        {/* Root Categories Section */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold font-heading ">
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
    return <NotFoundState onRetry={() => refetch()} />;
  }

  const { category, subcategories, recordings } = data;

  const breadcrumbs = slug.map((slugPart, index) => {
    const path = slug.slice(0, index + 1).join("/");
    return { label: slugToLabel(slugPart), href: `/${path}` };
  });

  return (
    <div className="flex flex-col gap-8 py-2">
      <CategoryBreadcrumbs breadcrumbs={breadcrumbs} />

      {/* Category Header */}
      <div className="flex flex-col gap-2 border-b border-border pb-6">
        <span className="text-xs font-bold text-primary tracking-wider uppercase">
          Category
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight">
          {category.name}
        </h1>
      </div>

      {/* Subcategories Section */}
      {subcategories.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold font-heading flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            Subcategories
          </h2>
          <CategoryList categories={subcategories} isLoading={false} />
        </section>
      )}

      {/* Recordings Section */}
      {recordings.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold font-heading flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Discourses & Recordings
          </h2>
          <RecordingList {...{ recordings, isPending, category }} />
        </section>
      )}
    </div>
  );
};
