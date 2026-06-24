import type { Metadata } from "next";
import type { CategoryPageData } from "@/hooks/use-category-page";
import { getLocalCategories } from "@/lib/local-sync-data";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import type { Category } from "@/types";
import { ClientShell } from "@/views/client-shell";

export const revalidate = 28800; // 8 hours (3 times a day)

export const metadata: Metadata = {
  title: "HG Radheshyamdas Spiritual Discourses | Home",
  description:
    "Explore a rich treasury of spiritual lectures, deep commentaries on scriptures, and wisdom to guide your daily life by HG Radheshyamdas.",
  alternates: {
    canonical: "https://radheshyamdas.com",
  },
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

export default async function Home() {
  let rootCats: Category[] = [];

  const isLocalSource =
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PHASE === "phase-production-build";

  if (isLocalSource) {
    try {
      const categories = await getLocalCategories();
      rootCats = categories.filter((c: Category) => c.path === "");
    } catch (e) {
      console.error("Failed to load local root categories:", e);
    }
  } else {
    const supabase = getSupabaseServerClient();
    const { data: subcategories } = await supabase
      .from("categories")
      .select("*")
      .eq("path", "");
    rootCats = (subcategories as Category[]) || [];
  }

  const initialData: CategoryPageData = {
    subcategories: rootCats,
    recordings: [],
  };

  const aboutList = rootCats
    .filter(
      (cat) =>
        cat.url_path !== "trash" &&
        typeof cat.url_path === "string" &&
        cat.url_path.trim() !== "",
    )
    .map((cat) => {
      const path = (cat.url_path as string)
        .replace(/_/g, "-")
        .replace(/\./g, "/");
      return {
        "@type": "CollectionPage",
        name: cat.name,
        url: `https://radheshyamdas.com/${path}`,
      };
    });

  // Structured Data (JSON-LD) for AEO and search snippets
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "HG Radheshyamdas Spiritual Discourses",
    url: "https://radheshyamdas.com",
    description:
      "Explore a rich treasury of spiritual lectures, deep commentaries on scriptures, and wisdom to guide your daily life by HG Radheshyamdas.",
    about: aboutList.length > 0 ? aboutList : undefined,
  };

  const personJsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: "Radheshyam Das",
    alternateName: "HG Radheshyamdas",
    jobTitle: "Temple President & Youth Mentor",
    affiliation: {
      "@type": "Organization",
      name: "ISKCON Pune",
    },
    alumniOf: {
      "@type": "EducationalOrganization",
      name: "IIT Bombay",
    },
    knowsAbout: [
      "Bhagavad Gita",
      "Vedic Philosophy",
      "Srimad Bhagavatam",
      "Stress Management",
      "Leadership Development",
    ],
    sameAs: [
      "https://www.youtube.com/@RadheshyamDasDevotionalvideos",
      "http://www.radheshyamdas.com",
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: ld+json
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        // biome-ignore lint/security/noDangerouslySetInnerHtml: ld+json
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />
      <ClientShell initialData={initialData} />
    </>
  );
}
