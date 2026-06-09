"use client";

import { use } from "react";
import { useCategoryPage } from "@/hooks/useCategoryPage";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = use(params);
  const { data, isPending, error } = useCategoryPage(slug);

  if (isPending) return null;
  if (error || !data) return null;

  return <div>{data.category.name}</div>;
}
