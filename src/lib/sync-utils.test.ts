import { describe, expect, it } from "vitest";
import { STORE } from "../constants";
import { castValue } from "./sync-utils";

describe("sync-utils castValue", () => {
  describe("Numeric fields", () => {
    it("should parse valid integers to numbers", () => {
      expect(castValue("categories", "id", "123")).toBe(123);
      expect(castValue("recordings", "category_id", "456")).toBe(456);
      expect(castValue("services", "order_ind", "5")).toBe(5);
    });

    it("should return null for empty string or invalid integers", () => {
      expect(castValue("categories", "id", "")).toBeNull();
      expect(castValue("categories", "id", "abc")).toBeNull();
    });
  });

  describe("Boolean fields", () => {
    it("should parse true-like values to true", () => {
      expect(castValue("services", "is_public", "true")).toBe(true);
      expect(castValue("services", "is_public", "t")).toBe(true);
      expect(castValue("services", "is_public", "1")).toBe(true);
    });

    it("should parse other values to false", () => {
      expect(castValue("services", "is_public", "false")).toBe(false);
      expect(castValue("services", "is_public", "f")).toBe(false);
      expect(castValue("services", "is_public", "0")).toBe(false);
      expect(castValue("services", "is_public", "something")).toBe(false);
    });

    it("should return null for empty string", () => {
      expect(castValue("services", "is_public", "")).toBeNull();
    });
  });

  describe("Array fields", () => {
    it("should parse postgres array representation to numeric arrays", () => {
      expect(castValue("recordings", "speaker_ids", "{1,2,3}")).toEqual([
        1, 2, 3,
      ]);
      expect(castValue("recordings", "allowed_roles", "[1,2,3]")).toEqual([
        1, 2, 3,
      ]);
      expect(castValue("recordings", "lang_ids", "4,5,6")).toEqual([4, 5, 6]);
    });

    it("should handle empty or invalid representation as empty array", () => {
      expect(castValue("recordings", "speaker_ids", "")).toEqual([]);
      expect(castValue("recordings", "speaker_ids", "{}")).toEqual([]);
      expect(castValue("recordings", "speaker_ids", "[]")).toEqual([]);
      expect(castValue("recordings", "speaker_ids", "[abc]")).toEqual([]);
    });
  });

  describe("String / text fields", () => {
    it("should preserve string content", () => {
      expect(castValue("services", "description", "Spiritual discourse")).toBe(
        "Spiritual discourse",
      );
    });

    it("should preserve numeric string contents as strings", () => {
      expect(castValue("services", "description", "108")).toBe("108");
      expect(castValue("recordings", "audio_id", "12345")).toBe("12345");
      expect(castValue("recordings", "name", "Lecture 10")).toBe("Lecture 10");
    });

    it("should not return null for empty strings", () => {
      expect(castValue("services", "description", "")).not.toBeNull();
      expect(castValue("recordings", "audio_id", "")).not.toBeNull();
    });
  });

  describe("Redirects table special case", () => {
    it("should keep id field as string even though it is named id", () => {
      expect(castValue(STORE.REDIRECTS, "id", "/about-us")).toBe("/about-us");
      expect(castValue(STORE.REDIRECTS, "id", "123")).toBe("123");
    });
  });
});
