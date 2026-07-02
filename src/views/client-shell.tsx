"use client";

import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import type { CategoryPageData } from "@/hooks/use-category-page";

const HomePageShell = dynamic(() =>
  import("./home-page-shell").then((mod) => mod.HomePageShell),
);

const CategoryPageShell = dynamic(() =>
  import("./category-page-shell").then((mod) => mod.CategoryPageShell),
);

interface ClientShellProps {
  initialData?: CategoryPageData;
}

export const ClientShell = ({ initialData }: ClientShellProps) => {
  const pathname = usePathname();
  const slug = pathname.split("/").filter(Boolean);

  if (slug.length === 0) {
    return <HomePageShell {...{ initialData }} />;
  }

  return <CategoryPageShell {...{ initialData, slug }} />;
};
