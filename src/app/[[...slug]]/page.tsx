import type { Metadata } from "next";
import { unstable_cache } from "next/cache";
import { redirect } from "next/navigation";
import { cache } from "react";
import { REVALIDATE_30_DAYS } from "@/app/api/constants";
import { getCachedPublicUrlPaths } from "@/app/api/sync/delta-service";
import { ASSET_BASE_URL } from "@/constants";
import type { CategoryPageData } from "@/hooks/use-category-page";
import { axiomLogger } from "@/lib/axiom-logger";
import { getCategoryImageUrl } from "@/lib/storage";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { isValidCategoryPath, pathToUrlPath, slugToLabel } from "@/lib/utils";
import { ClientShell } from "@/views/client-shell";

export const revalidate = 2592000; // 30 days fallback if on-demand revalidation fails
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

const getCachedCategoryPageData = cache(
  async (urlPath: string): Promise<CategoryPageData | null> =>
    unstable_cache(
      async () => {
        if (urlPath) {
          if (!isValidCategoryPath(urlPath)) {
            console.warn("Invalid category path: ", urlPath);
            return null;
          }

          const validPaths = await getCachedPublicUrlPaths();
          if (!validPaths.includes(urlPath)) {
            console.warn("URL path not found: ", urlPath);
            return null;
          }
        }
        const { data, error } = await getSupabaseServerClient().rpc(
          "get_category_page_data",
          { p_url_path: urlPath },
        );

        if (error) {
          console.error(
            "getCachedCategoryPageData rpc error: ",
            urlPath,
            error,
          );
          axiomLogger.error("getCachedCategoryPageData RPC error", {
            urlPath,
            error,
          });
          return null;
        }

        return (data as unknown as CategoryPageData) || null;
      },
      ["category-page-data", urlPath],
      {
        revalidate: REVALIDATE_30_DAYS,
        tags: ["category-page-data", `category:${urlPath}`],
      },
    )(),
);

const homePageMetadata: Metadata = {
  title: "Radheshyam Das Spiritual Discourses | Home",
  description:
    "Explore a rich treasury of spiritual lectures, deep commentaries on scriptures, and wisdom to guide your daily life by Radheshyam Das.",
  alternates: {
    canonical: `https://${process.env["VERCEL_PROJECT_PRODUCTION_URL"] || "radheshyamdas.com"}`,
  },
  openGraph: {
    title: "Radheshyam Das Spiritual Discourses",
    description:
      "Explore a rich treasury of spiritual lectures, deep commentaries on scriptures, and wisdom to guide your daily life by Radheshyam Das.",
    url: "https://radheshyamdas.com",
    siteName: "Radheshyam Das Spiritual Discourses",
    type: "website",
    images: [
      {
        url: "https://radheshyamdas.com/rsp.webp",
        width: 512,
        height: 512,
        alt: "Radheshyam Das",
      },
    ],
  },
};

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  if (process.env.NODE_ENV === "development") return {};
  const { slug } = await params;
  if (!slug?.length) return homePageMetadata;

  if (slug.length === 1 && slug[0] === "library") {
    return {
      title: "Spiritual Library | Radheshyam Das Discourses",
      description:
        "Explore the comprehensive Vedic library of audio discourses, lecture series, and sacred literature commentaries by Radheshyam Das.",
      alternates: { canonical: "https://radheshyamdas.com/library" },
    };
  }

  const urlPath = pathToUrlPath(slug);
  const rpcData = await getCachedCategoryPageData(urlPath);
  const category = rpcData?.category;

  const title = category?.name
    ? `${category.name} | Radheshyam Das Spiritual Discourses`
    : "Spiritual Discourses";
  const description = category?.name
    ? `Explore lectures on ${category.name} by Radheshyam Das.`
    : "Spiritual lectures.";
  const imgPath =
    getCategoryImageUrl(category, "webp") ||
    "https://radheshyamdas.com/rsp.webp";

  return {
    title,
    description,
    alternates: { canonical: `https://radheshyamdas.com/${slug.join("/")}` },
    openGraph: {
      title,
      description,
      type: "website",
      images: [{ url: imgPath, alt: category?.name || "HG" }],
    },
  };
};

const generateJsonLdData = async (slug?: string[]) => {
  if (process.env.NODE_ENV === "development") return { structuredData: [] };

  // If old direct category path, redirect to /library/...
  if (slug?.length && slug[0] !== "library") {
    redirect(`/library/${slug.join("/")}`);
  }

  const urlPath = pathToUrlPath(slug ?? []);
  const rpcData = await getCachedCategoryPageData(urlPath);

  if (rpcData?.redirectTo) redirect(rpcData.redirectTo);
  const { category, recordings = [], subcategories = [] } = rpcData ?? {};

  const jsonLdOutputs = [];

  // Home Specific Structured Data
  if (!slug?.length) {
    const aboutList = subcategories
      .filter((cat) => cat.url_path && cat.url_path !== "trash")
      .map((cat) => ({
        "@type": "CollectionPage",
        name: cat.name,
        url: `https://radheshyamdas.com/${(cat.url_path as string).replace(/_/g, "-").replace(/\./g, "/")}`,
      }));

    jsonLdOutputs.push(
      {
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "Radheshyamdas Spiritual Discourses",
        url: "https://radheshyamdas.com",
        about: aboutList.length > 0 ? aboutList : undefined,
      },
      {
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Radheshyam Das",
        alternateName: "Radheshyamdas",
        affiliation: { "@type": "Organization", name: "ISKCON Pune" },
        knowsAbout: ["Bhagavad Gita", "Vedic Philosophy", "Srimad Bhagavatam"],
      },
    );
    return { data: rpcData, structuredData: jsonLdOutputs };
  }

  // Categories & Recordings Framework Separation
  // BreadCrumbs
  jsonLdOutputs.push({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://radheshyamdas.com",
      },
      ...slug.map((slugPart, idx) => ({
        "@type": "ListItem",
        position: idx + 2,
        name: slugToLabel(slugPart),
        item: `https://radheshyamdas.com/${slug.slice(0, idx + 1).join("/")}`,
      })),
    ],
  });

  // 1. Structural Subcategories List
  if (subcategories.length > 0) {
    jsonLdOutputs.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${category?.name || "Category"} - Subcategories`,
      numberOfItems: subcategories.length,
      itemListElement: subcategories.map((sub, index) => ({
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "CollectionPage",
          name: sub.name,
          url: `https://radheshyamdas.com/${(sub.url_path as string).replace(/_/g, "-").replace(/\./g, "/")}`,
        },
      })),
    });
  }

  // 2. Structural Leaf Recordings List
  if (recordings.length > 0) {
    jsonLdOutputs.push({
      "@context": "https://schema.org",
      "@type": "ItemList",
      name: `${category?.name || "Category"} - Discourses`,
      numberOfItems: recordings.length,
      itemListElement: recordings.map((rec, index) => {
        const mediaArray = [];

        if (rec.audio_id) {
          mediaArray.push({
            "@type": "AudioObject",
            name: `${rec.name} (Audio)`,
            contentUrl: `${ASSET_BASE_URL}${rec.audio_id}`,
          });
        }

        if (rec.yt_id) {
          mediaArray.push({
            "@type": "VideoObject",
            name: `${rec.name} (Video)`,
            embedUrl: `https://youtube.com/embed/${rec.yt_id}`,
            url: `https://youtube.com/watch?v=${rec.yt_id}`,
          });
        }

        return {
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": "CreativeWork",
            name: rec.name,
            datePublished: rec.recorded_at || undefined,
            // inLanguage: rec.languages?.length
            //   ? rec.languages.map((l) => l.name)
            //   : ["English"],
            // contentLocation: rec.venue?.name
            //   ? { "@type": "Place", name: rec.venue.name }
            //   : undefined,
            associatedMedia: mediaArray.length > 0 ? mediaArray : undefined,
          },
        };
      }),
    });
  }

  return { data: rpcData, structuredData: jsonLdOutputs };
};

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const { data, structuredData } = await generateJsonLdData(slug);

  return (
    <>
      {structuredData.map((schema, idx) => (
        <script
          // biome-ignore lint/suspicious/noArrayIndexKey: ok
          key={idx}
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: json+ld
          dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
        />
      ))}
      <ClientShell initialData={data ?? undefined} />
    </>
  );
}
