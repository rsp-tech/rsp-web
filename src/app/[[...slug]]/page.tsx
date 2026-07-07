import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ASSET_BASE_URL } from "@/constants";
import type { CategoryPageData } from "@/hooks/use-category-page";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { slugToLabel } from "@/lib/utils";
import { ClientShell } from "@/views/client-shell";

export const revalidate = 604800; // One week - fallback if on demand revalidation failed
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug?: string[] }>;
}

const homePageMetadata: Metadata = {
  title: "HG Radheshyamdas Spiritual Discourses | Home",
  description:
    "Explore a rich treasury of spiritual lectures, deep commentaries on scriptures, and wisdom to guide your daily life by HG Radheshyamdas.",
  alternates: { canonical: "https://radheshyamdas.com" },
  openGraph: {
    title: "HG Radheshyamdas Spiritual Discourses",
    description:
      "Explore a rich treasury of spiritual lectures, deep commentaries on scriptures, and wisdom to guide your daily life by HG Radheshyamdas.",
    url: "https://radheshyamdas.com",
    siteName: "HG Radheshyamdas Spiritual Discourses",
    type: "website",
    images: [
      {
        url: "https://radheshyamdas.com/rsp.webp",
        width: 512,
        height: 512,
        alt: "HG Radheshyamdas",
      },
    ],
  },
};

const getCategoryDetails = async (urlPath: string) => {
  const { data } = await getSupabaseServerClient()
    .from("categories")
    .select("name, img_id")
    .eq("url_path", urlPath)
    .single();
  return data || null;
};

export const generateMetadata = async ({
  params,
}: PageProps): Promise<Metadata> => {
  if (process.env.NODE_ENV === "development") return {};
  const { slug } = await params;
  if (!slug?.length) return homePageMetadata;

  const urlPath = slug.join(".").replace(/-/g, "_");
  const category = await getCategoryDetails(urlPath);

  const title = category?.name
    ? `${category.name} | HG Radheshyamdas Spiritual Discourses`
    : "Spiritual Discourses";
  const description = category?.name
    ? `Explore lectures on ${category.name} by HG Radheshyamdas.`
    : "Spiritual lectures.";
  const imgPath = category?.img_id
    ? `https://radheshyamdas.com/img/${category.img_id.toString(36)}.webp`
    : "https://radheshyamdas.com/rsp.webp";

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

  const urlPath = slug?.join(".").replace(/-/g, "_") ?? "";

  const { data } = await getSupabaseServerClient().rpc(
    "get_category_page_data",
    { p_url_path: urlPath },
  );
  const rpcData = data as unknown as CategoryPageData;

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
        name: "HG Radheshyamdas Spiritual Discourses",
        url: "https://radheshyamdas.com",
        about: aboutList.length > 0 ? aboutList : undefined,
      },
      {
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Radheshyam Das",
        alternateName: "HG Radheshyamdas",
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
      <ClientShell
        initialData={data || { subcategories: [], recordings: [] }}
      />
    </>
  );
}
