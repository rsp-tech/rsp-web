import { describe, expect, it } from "vitest";
import { CategoryBreadcrumbs } from "./category-breadcrumbs";
import { CategoryHero } from "./category-hero";
import { ClientShell } from "./client-shell";

describe.concurrent("views suite", () => {
  it.concurrent("exports all view components as functions", () => {
    expect(typeof CategoryHero).toBe("function");
    expect(typeof CategoryBreadcrumbs).toBe("function");
    expect(typeof ClientShell).toBe("function");
  });
});
