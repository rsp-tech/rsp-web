import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";
import {
  categoryPath,
  cn,
  createLimiter,
  errorMessage,
  getUserDisplayName,
  slugToLabel,
  sortByOrderInd,
} from "./utils";

describe("utils cn", () => {
  it("should merge tailwind classes properly", () => {
    expect(cn("bg-red-500", "bg-blue-500")).toBe("bg-blue-500");
    expect(cn("px-2 py-1", "p-4")).toBe("p-4");
  });

  it("should handle conditional classes and truthy/falsy values", () => {
    expect(cn("class1", false && "class2", true && "class3")).toBe(
      "class1 class3",
    );
    expect(cn("class1", undefined, null, "class2")).toBe("class1 class2");
  });
});

describe("utils categoryPath", () => {
  it("should replace dots with slashes and underscores with dashes", () => {
    expect(categoryPath("spiritual.discourses_lectures")).toBe(
      "spiritual/discourses-lectures",
    );
    expect(categoryPath("a.b.c_d")).toBe("a/b/c-d");
  });

  it("should return the same string if there are no dots or underscores", () => {
    expect(categoryPath("simple")).toBe("simple");
  });
});

describe("utils slugToLabel", () => {
  it("should convert underscore-separated slugs to capitalized labels", () => {
    expect(slugToLabel("spiritual_discourses")).toBe("Spiritual Discourses");
    expect(slugToLabel("radha_krishna")).toBe("Radha Krishna");
  });

  it("should handle single word slugs", () => {
    expect(slugToLabel("hello")).toBe("Hello");
  });
});

describe("utils errorMessage", () => {
  it("should extract message from Error objects", () => {
    expect(errorMessage(new Error("Test error message"))).toBe(
      "Test error message",
    );
  });

  it("should convert unknown values to strings", () => {
    expect(errorMessage("String error")).toBe("String error");
    expect(errorMessage(404)).toBe("404");
    expect(errorMessage({ error: "object" })).toBe("[object Object]");
  });
});

describe("utils getUserDisplayName", () => {
  it("should return full name from user metadata if present", () => {
    const user = {
      user_metadata: { full_name: "Radhe Shyam" },
      email: "test@example.com",
    } as unknown as User;
    expect(getUserDisplayName(user)).toBe("Radhe Shyam");
  });

  it("should fallback to email username if full name is missing", () => {
    const user = {
      user_metadata: {},
      email: "shyam.das@example.com",
    } as unknown as User;
    expect(getUserDisplayName(user)).toBe("shyam.das");
  });

  it("should return fallback if user or email/name is undefined", () => {
    expect(getUserDisplayName(undefined)).toBe("User");
    expect(getUserDisplayName(undefined, "Guest")).toBe("Guest");

    const user = {
      user_metadata: {},
    } as unknown as User;
    expect(getUserDisplayName(user, "Guest")).toBe("Guest");
  });
});

describe("utils createLimiter", () => {
  it("should limit concurrency to the specified number", async () => {
    const limit = createLimiter(2);
    let active = 0;
    let maxActive = 0;

    const task = async (id: number) => {
      active++;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 50));
      active--;
      return id;
    };

    const results = await Promise.all([
      limit(() => task(1)),
      limit(() => task(2)),
      limit(() => task(3)),
      limit(() => task(4)),
    ]);

    expect(results).toEqual([1, 2, 3, 4]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});

describe("utils sortByOrderInd", () => {
  it("should sort items by order_ind ascending by default", () => {
    const items = [
      { name: "A", order_ind: 10 },
      { name: "B", order_ind: 2 },
      { name: "C", order_ind: 5 },
      { name: "D", order_ind: null },
    ];
    items.sort(sortByOrderInd());
    expect(items.map((i) => i.name)).toEqual(["D", "B", "C", "A"]);
  });

  it("should sort items by order_ind descending if specified", () => {
    const items = [
      { name: "A", order_ind: 10 },
      { name: "B", order_ind: 2 },
      { name: "C", order_ind: 5 },
      { name: "D", order_ind: null },
    ];
    items.sort(sortByOrderInd(-1));
    expect(items.map((i) => i.name)).toEqual(["A", "C", "B", "D"]);
  });
});
