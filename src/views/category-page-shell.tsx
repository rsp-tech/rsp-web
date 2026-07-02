import { FolderOpen, Music } from "lucide-react";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import { CategoryList } from "@/components/category-list";
import { NotFoundState } from "@/components/not-found-state";
import { RecordingList } from "@/components/recording-list";
import {
  type CategoryPageData,
  useCategoryPage,
} from "@/hooks/use-category-page";
import { trackEvent } from "@/lib/analytics";
import { slugToLabel } from "@/lib/utils";
import { CategoryBreadcrumbs } from "./category-breadcrumbs";

interface CategoryPageShellProps {
  initialData?: CategoryPageData;
  slug: string[];
}

export const CategoryPageShell = ({
  initialData,
  slug,
}: CategoryPageShellProps) => {
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
          {category?.name}
        </h1>
      </div>

      {/* Subcategories Section */}
      {subcategories.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold font-heading flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            Subcategories
          </h2>
          <CategoryList categories={subcategories} isLoading={isPending} />
        </section>
      )}

      {/* Recordings Section */}
      {recordings.length > 0 && (
        <section className="flex flex-col gap-4">
          <h2 className="text-xl font-bold font-heading flex items-center gap-2">
            <Music className="w-5 h-5 text-primary" />
            Discourses & Recordings
          </h2>
          <RecordingList {...{ recordings, category }} />
        </section>
      )}
    </div>
  );
};
