"use client";

import { usePathname } from "next/navigation";
import type { CategoryPageData } from "@/hooks/use-category-page";
import { HomePageShell } from "./home-page-shell";
import { CategoryPageShell } from "./category-page-shell";

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
