import { FolderOpen } from "lucide-react";
import { CategoryList } from "@/components/category-list";
import {
  type CategoryPageData,
  useCategoryPage,
} from "@/hooks/use-category-page";
import { CategoryHero } from "./category-hero";

interface HomePageShellProps {
  initialData?: CategoryPageData;
}

export const HomePageShell = ({ initialData }: HomePageShellProps) => {
  const { data, isPending, error } = useCategoryPage([], initialData);
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
          categories={data?.subcategories.filter((c) => c.url_path !== "trash")}
          isLoading={isPending}
          error={error}
        />
      </section>
    </div>
  );
};
