import { describe, expect, it } from "vitest";
import { useConsultationForm } from "./use-consultation-form";

describe.concurrent("use-consultation-form suite", () => {
  it.concurrent("exports useConsultationForm function", () => {
    expect(typeof useConsultationForm).toBe("function");
  });
});
