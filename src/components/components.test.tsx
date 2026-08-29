import { describe, expect, it } from "vitest";
import { CategoryCard } from "./category-card";
import { CategoryList } from "./category-list";
import { Footer } from "./footer";
import { Header } from "./header";
import { Loading } from "./loading";
import { NotFoundState } from "./not-found-state";
import { ProgressBar } from "./progress-bar";

describe.concurrent("components suite", () => {
  it.concurrent("exports core components as valid React components", () => {
    expect(typeof CategoryCard).toBe("function");
    expect(typeof CategoryList).toBe("function");
    expect(typeof Footer).toBe("function");
    expect(typeof Header).toBe("function");
    expect(typeof Loading).toBe("function");
    expect(typeof NotFoundState).toBe("function");
    expect(typeof ProgressBar).toBe("function");
  });
});
