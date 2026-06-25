import type { MetadataRoute } from "next";
import { getSupabaseServerClient } from "@/lib/supabase-server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getSupabaseServerClient();
  const baseUrl = "https://radheshyamdas.com";

  // Fetch all active categories from Supabase
  const { data: categories } = await supabase
    .from("categories")
    .select("url_path, updated_at")
    .neq("url_path", "trash");

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact-us`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/get-involved`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = (categories || [])
    .filter(
      (cat) => typeof cat.url_path === "string" && cat.url_path.trim() !== "",
    )
    .map((cat) => {
      const urlPath = (cat.url_path as string)
        .replace(/_/g, "-")
        .replace(/\./g, "/");

      return {
        url: `${baseUrl}/${urlPath}`,
        lastModified: cat.updated_at ? new Date(cat.updated_at) : new Date(),
        changeFrequency: "weekly",
        priority: 0.7,
      };
    });

  return [...staticRoutes, ...categoryRoutes];
}
