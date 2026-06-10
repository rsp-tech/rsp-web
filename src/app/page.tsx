"use client";

import { BookOpen, Compass, FolderOpen, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRootCategories } from "@/hooks/use-root-categories";
import { getSupabaseClient } from "@/lib/supabase-browser";
import type { Category } from "@/types";

export default function Home() {
  const { data: categories, isLoading, error } = useRootCategories();

  const getCategoryImageUrl = (cat: Category) => {
    if (!cat.img_id) return null;
    const supabase = getSupabaseClient();
    const fileName = `${cat.img_id.toString(36)}.webp`;
    const { data } = supabase.storage.from("images").getPublicUrl(fileName);
    return data.publicUrl;
  };

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

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-sm font-semibold text-muted-foreground">
              Loading spiritual categories...
            </p>
          </div>
        ) : error ? (
          <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-medium">
            Could not load categories. Please try refreshing.
          </div>
        ) : !categories || categories.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
            No categories available. Background sync may be running.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {categories.map((cat) => {
              const imgUrl = getCategoryImageUrl(cat);
              const slugPath = cat.url_path.split(".").join("/");

              return (
                <Link
                  key={cat.id}
                  href={`/${slugPath}`}
                  className="group relative flex flex-col h-48 rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1 cursor-pointer"
                >
                  {/* Category Image background with dark overlay */}
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={cat.name}
                      className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-linear-to-tr from-primary/20 via-primary/5 to-transparent" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

                  {/* Category Content */}
                  <div className="relative mt-auto p-5 flex flex-col gap-1">
                    <span className="text-xs font-bold text-primary-foreground/70 tracking-wider uppercase">
                      Category
                    </span>
                    <h3 className="text-lg font-bold font-heading text-white group-hover:text-primary-foreground transition-colors line-clamp-2">
                      {cat.name}
                    </h3>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
