import type { Metadata } from "next";
import { redirect } from "next/navigation";
import type { CategoryPageData } from "@/hooks/use-category-page";
import {
  getLocalCategories,
  getLocalCategoryPageData,
} from "@/lib/local-sync-data";
import { getAssetUrl } from "@/lib/storage";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { slugToLabel } from "@/lib/utils";
import type { Category } from "@/types";
import { ClientShell } from "@/views/client-shell";

export const revalidate = 28800; // 8 hours (3 times a day)
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const urlPath = slug.join(".").replace(/-/g, "_");

  const isLocalSource =
    process.env.NODE_ENV === "development" ||
    process.env["NEXT_PHASE"] === "phase-production-build";

  let categoryName = "";
  let imgId: number | null = null;

  if (isLocalSource) {
    try {
      const categories = await getLocalCategories();
      const category = categories.find((c: Category) => c.url_path === urlPath);
      if (category) {
        categoryName = category.name;
        imgId = category.img_id;
      }
    } catch (e) {
      console.error("Failed to load local category metadata:", e);
    }
  } else {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase
      .from("categories")
      .select("name, img_id")
      .eq("url_path", urlPath)
      .single();
    if (data) {
      categoryName = data.name;
      imgId = data.img_id;
    }
  }

  const title = categoryName
    ? `${categoryName} | HG Radheshyamdas Spiritual Discourses`
    : "Spiritual Discourses";
  const description = categoryName
    ? `Explore lectures, commentaries, and wisdom on ${categoryName} by HG Radheshyamdas.`
    : "Spiritual lectures, commentaries, and wisdom by HG Radheshyamdas";

  const imgPath = imgId
    ? `https://radheshyamdas.com/img/${imgId.toString(36)}.webp`
    : "https://radheshyamdas.com/rsp.webp";

  return {
    title,
    description,
    alternates: {
      canonical: `https://radheshyamdas.com/${slug.join("/")}`,
    },
    openGraph: {
      title,
      description,
      type: "website",
      images: [
        {
          url: imgPath,
          alt: categoryName || "HG Radheshyamdas",
        },
      ],
    },
  };
}

export default async function CategoryPage({ params }: PageProps) {
  const { slug } = await params;
  const urlPath = slug.join(".").replace(/-/g, "_");

  const isLocalSource =
    process.env.NODE_ENV === "development" ||
    process.env["NEXT_PHASE"] === "phase-production-build";

  let rpcData: CategoryPageData | null = null;

  if (isLocalSource) {
    rpcData = await getLocalCategoryPageData(urlPath);
  } else {
    const supabase = getSupabaseServerClient();
    const { data } = await supabase.rpc("get_category_page_data", {
      p_url_path: urlPath,
    });
    rpcData = data as unknown as CategoryPageData;
  }

  // if (error || !rpcData) {
  //   return (
  //     <div className="p-4 bg-destructive/10 text-destructive border border-destructive/20 rounded-xl text-sm font-medium">
  //       Failed to load this category. Please check your connection or path.
  //     </div>
  //   );
  // }

  const data = rpcData as unknown as CategoryPageData | undefined;

  if (data?.redirectTo) {
    redirect(data.redirectTo);
  }

  const { category, recordings } = data ?? {};

  // Breadcrumbs JSON-LD
  const breadcrumbsJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://radheshyamdas.com",
      },
      ...slug.map((slugPart, index) => {
        const path = slug.slice(0, index + 1).join("/");
        return {
          "@type": "ListItem",
          position: index + 2,
          name: slugToLabel(slugPart),
          item: `https://radheshyamdas.com/${path}`,
        };
      }),
    ],
  };

  // Recordings JSON-LD (ItemList + AudioObject)
  const recordingsJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: category?.name,
    description: `Discourses and recordings in the ${category?.name} category.`,
    numberOfItems: recordings?.length,
    itemListElement: recordings?.map((rec, index) => {
      const hasAudio = !!rec.audio_id;
      const hasYoutube = !!rec.yt_id;

      return {
        "@type": "ListItem",
        position: index + 1,
        item: {
          "@type": "AudioObject",
          name: rec.name,
          description: `Spiritual discourse on "${rec.name}" by HG Radheshyamdas.`,
          author: {
            "@type": "Person",
            name:
              rec.speakers && rec.speakers.length > 0
                ? rec.speakers.map((s) => s.name).join(", ")
                : "HG Radheshyamdas",
          },
          datePublished: rec.recorded_at || undefined,
          inLanguage:
            rec.languages && rec.languages.length > 0
              ? rec.languages.map((l) => l.name)
              : ["English"],
          contentUrl: hasAudio ? getAssetUrl(rec.audio_id ?? "") : undefined,
          sameAs: hasYoutube
            ? `https://youtube.com/watch?v=${rec.yt_id}`
            : undefined,
        },
      };
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: ld+json
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbsJsonLd) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: ld+json
        dangerouslySetInnerHTML={{ __html: JSON.stringify(recordingsJsonLd) }}
      />
      <ClientShell initialData={data} />
    </>
  );
}
