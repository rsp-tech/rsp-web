"use client";

import { BookOpen, Compass, FolderOpen } from "lucide-react";
import { CategoryList } from "@/components/category-list";
import { useCategoryPage } from "@/hooks/use-category-page";

export default function Home() {
  const { data, isLoading, error } = useCategoryPage([]);

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
          categories={data?.subcategories}
          isLoading={isLoading}
          error={error}
        />
      </section>
    </div>
  );
}
