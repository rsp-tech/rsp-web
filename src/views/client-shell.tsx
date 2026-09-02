"use client";

import { FolderOpen } from "lucide-react";
import dynamic from "next/dynamic";
import { redirect, usePathname } from "next/navigation";
import { CategoryList } from "@/components/category-list";
import { FeaturedSection } from "@/components/featured-section";
import { GuidanceSpotlight } from "@/components/guidance-spotlight";
import { Loading } from "@/components/loading";
import { NotFoundState } from "@/components/not-found-state";
import { RecordingsSection } from "@/components/recordings-section";

const YouTubeShowcase = dynamic(() =>
  import("@/components/youtube-showcase").then((m) => m.YouTubeShowcase),
);

import {
  type CategoryPageData,
  useCategoryPage,
} from "@/hooks/use-category-page";
import { useHomepage } from "@/hooks/use-homepage";
import { usePublicSync } from "@/hooks/use-public-sync";
import { useRoleSync } from "@/hooks/use-role-sync";
import { clearSyncMetaCache } from "@/lib/sync-worker-client";
import { slugToLabel } from "@/lib/utils";
import type { YouTubeVideo } from "@/lib/youtube-service";
import { CategoryBreadcrumbs } from "./category-breadcrumbs";
import { CategoryHero } from "./category-hero";

interface ClientShellProps {
  initialData?: CategoryPageData;
  youtubeVideos?: YouTubeVideo[];
}

export const ClientShell = ({
  initialData,
  youtubeVideos,
}: ClientShellProps) => {
  const pathname = usePathname();
  const slug = pathname.split("/").filter(Boolean);
  const { data, isPending, error, refetch } = useCategoryPage(
    pathname,
    initialData,
  );
  const { data: homepageData } = useHomepage();
  const { isFetching: isPublicSyncing, refetch: syncPublic } = usePublicSync();
  const {
    isSyncingOrPendingAuth: isRoleSyncing,
    hasRole,
    refetch: syncRole,
  } = useRoleSync();

  const isSyncing = isPublicSyncing || isRoleSyncing;

  const handleRetry = async () => {
    await clearSyncMetaCache();
    await Promise.all([syncPublic(), hasRole ? syncRole() : Promise.resolve()]);
    await refetch();
  };

  if (data?.redirectTo) {
    redirect(data.redirectTo);
  }

  if (isPending || (slug.length > 0 && !data?.category && isSyncing)) {
    return <Loading />;
  }

  if (error) {
    return <NotFoundState onRetry={handleRetry} message={error?.message} />;
  }

  if (slug.length === 0) {
    return (
      <div className="flex flex-col py-4" style={{ gap: "2.5rem" }}>
        <CategoryHero />

        {/* Guidance Spotlight */}
        {homepageData?.spotlights && homepageData.spotlights.length > 0 && (
          <GuidanceSpotlight spotlights={homepageData.spotlights} />
        )}

        {/* Dynamic Featured Sections */}
        {homepageData?.featuredSections?.map((section) => (
          <FeaturedSection key={section.id} section={section} />
        ))}

        {/* YouTube Discourses Showcase */}
        <YouTubeShowcase initialVideos={youtubeVideos} />

        {/* Root Categories Section */}
        <section className="flex flex-col gap-6">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            <h2 className="text-2xl font-bold font-heading">
              Explore Categories
            </h2>
          </div>

          <CategoryList
            categories={data?.subcategories.filter(
              (c) => c.url_path !== "trash",
            )}
          />
        </section>
      </div>
    );
  }

  if (slug.length === 1 && slug[0] === "library") {
    return (
      <div className="flex flex-col gap-8 py-2">
        <CategoryBreadcrumbs
          breadcrumbs={[{ label: "Library", href: "/library" }]}
        />

        <div className="flex flex-col gap-2 border-b border-border pb-6">
          <span className="text-xs font-bold text-primary tracking-wider uppercase">
            Spiritual Library
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold font-heading tracking-tight">
            All Discourses &amp; Categories
          </h1>
          <p className="text-sm text-muted-foreground">
            Explore the complete archive of philosophical lectures, Vedic
            commentaries, and seminar recordings.
          </p>
        </div>

        <section className="flex flex-col gap-4">
          <CategoryList
            categories={data?.subcategories.filter(
              (c) => c.url_path !== "trash",
            )}
          />
        </section>
      </div>
    );
  }

  if (!data?.category) {
    return <NotFoundState onRetry={handleRetry} />;
  }

  const { category, subcategories, recordings } = data;

  const breadcrumbs = [
    { label: "Library", href: "/library" },
    ...(slug[0] === "library" ? slug.slice(1) : slug).map(
      (slugPart, index, arr) => {
        const path = ["library", ...arr.slice(0, index + 1)].join("/");
        return { label: slugToLabel(slugPart), href: `/${path}` };
      },
    ),
  ];

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
          <CategoryList categories={subcategories} />
        </section>
      )}

      {/* Recordings Section */}
      {recordings.length > 0 && <RecordingsSection {...{ recordings }} />}
    </div>
  );
};
