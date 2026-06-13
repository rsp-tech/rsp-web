"use client";

import {
  Calendar,
  ChevronRight,
  FileDown,
  FileText,
  FolderOpen,
  Home,
  Loader2,
  MapPin,
  Music,
  User,
} from "lucide-react";
import Link from "next/link";
import { redirect, useSearchParams } from "next/navigation";
import { use, useEffect } from "react";
import { SiYoutube } from "react-icons/si";
import { CategoryList } from "@/components/category-list";
import { useCategoryPage } from "@/hooks/use-category-page";
import { getAssetUrl } from "@/lib/storage";
import { slugToLabel } from "@/lib/utils";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = use(params);
  const { data, isPending, error } = useCategoryPage(slug);
  const searchParams = useSearchParams();

  const q = searchParams.get("q");
  const m = searchParams.get("m");

  // Autoscroll to selected recording/material
  useEffect(() => {
    if (!isPending && q) {
      // Delay slightly to allow rendering to complete
      const timer = setTimeout(() => {
        const element = document.getElementById(`recording-${q}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
          element.focus();
        }
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isPending, q]);

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

  // Keyboard navigation for subcategories
  const handleCategoryKeyDown = (e: React.KeyboardEvent<HTMLAnchorElement>) => {
    const cards = Array.from(
      document.querySelectorAll<HTMLElement>("[data-category-item]"),
    );
    const index = cards.indexOf(e.currentTarget);
    if (index === -1) return;

    if (e.key === "Tab" && !e.shiftKey) {
      const firstRec = document.querySelector<HTMLElement>(
        "[data-recording-item]",
      );
      if (firstRec) {
        e.preventDefault();
        firstRec.focus();
      }
    } else if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      const next = (index + 1) % cards.length;
      cards[next]?.focus();
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      const prev = (index - 1 + cards.length) % cards.length;
      cards[prev]?.focus();
    }
  };

  // Keyboard navigation for recordings
  const handleRecordingKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const recs = Array.from(
      document.querySelectorAll<HTMLElement>("[data-recording-item]"),
    );
    const index = recs.indexOf(e.currentTarget);
    if (index === -1) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = (index + 1) % recs.length;
      recs[next]?.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = (index - 1 + recs.length) % recs.length;
      recs[prev]?.focus();
    }
  };

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
          <CategoryList
            categories={subcategories}
            isLoading={false}
            onCardKeyDown={handleCategoryKeyDown}
          />
        </section>
      )}

      {/* Recordings Section */}
      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-bold font-heading text-foreground flex items-center gap-2">
          <Music className="w-5 h-5 text-primary" />
          Discourses & Recordings
        </h2>

        {recordings.length === 0 ? (
          <div className="p-8 text-center text-sm text-muted-foreground border border-dashed border-border rounded-xl">
            No recordings in this category yet.
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {recordings.map((rec) => {
              const isHighlighted = q != null && Number(q) === rec.id;
              return (
                // biome-ignore lint/a11y/noStaticElementInteractions: handled for custom list focus/navigation
                <div
                  key={rec.id}
                  id={`recording-${rec.id}`}
                  // biome-ignore lint/a11y/noNoninteractiveTabindex: handled for custom list focus/navigation
                  tabIndex={0}
                  data-recording-item
                  onKeyDown={handleRecordingKeyDown}
                  className={`p-5 border rounded-2xl shadow-xs transition-all flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group focus:ring-2 focus:ring-primary focus:outline-hidden ${
                    isHighlighted
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border bg-card hover:shadow-sm"
                  }`}
                >
                  {/* Meta details */}
                  <div className="flex-1 flex flex-col gap-2">
                    <h3 className="font-bold text-base text-foreground leading-snug group-hover:text-primary transition-colors">
                      {rec.name}
                    </h3>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground font-medium">
                      {rec.speakers && rec.speakers.length > 0 && (
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-muted-foreground/75" />
                          {rec.speakers.map((s) => s.name).join(", ")}
                        </span>
                      )}
                      {rec.venue && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground/75" />
                          {rec.venue.name}
                        </span>
                      )}
                      {rec.recorded_at && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-muted-foreground/75" />
                          {new Date(rec.recorded_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>

                    {/* Materials Downloads List */}
                    {rec.materials && rec.materials.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-border/60 flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold tracking-wider uppercase text-muted-foreground">
                          Supporting Materials ({rec.materials.length})
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {rec.materials.map((mat) => {
                            const isMaterialHighlighted =
                              m != null && Number(m) === mat.id;
                            return (
                              <a
                                key={mat.id}
                                href={getAssetUrl(mat.storage_key)}
                                download
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors border ${
                                  isMaterialHighlighted
                                    ? "bg-primary/25 text-primary border-primary ring-1 ring-primary"
                                    : "bg-muted hover:bg-primary/10 hover:text-primary text-foreground border-border"
                                }`}
                              >
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate max-w-[150px]">
                                  {mat.name}
                                </span>
                                <FileDown className="w-3 h-3 text-muted-foreground shrink-0" />
                              </a>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Media Links / Actions */}
                  <div className="flex items-center gap-2 self-stretch md:self-auto justify-end border-t md:border-none border-border pt-3 md:pt-0 shrink-0">
                    {rec.audio_id && (
                      <a
                        href={getAssetUrl(rec.audio_id)}
                        download
                        className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 bg-muted hover:bg-primary hover:text-primary-foreground text-foreground px-3.5 py-2 rounded-xl text-xs font-bold transition-all border border-border cursor-pointer"
                        title="Download Audio"
                      >
                        <FileDown className="w-4 h-4" />
                        <span>Audio</span>
                      </a>
                    )}

                    {rec.yt_id && (
                      <a
                        href={`https://youtube.com/watch?v=${rec.yt_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 md:flex-initial inline-flex items-center justify-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                        title="Watch on YouTube"
                      >
                        <SiYoutube className="w-4 h-4" />
                        <span>YouTube</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
