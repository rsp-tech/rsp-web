import { describe, expect, it } from "vitest";
import { useMaterialPreview } from "./use-material-preview";

describe.concurrent("use-material-preview suite", () => {
  it.concurrent("manages openPreview and closePreview store actions", () => {
    const mockMaterial: any = {
      id: 1,
      name: "Slide.pdf",
      url: "https://test.pdf",
    };

    useMaterialPreview.getState()?.openPreview(mockMaterial);
    expect(useMaterialPreview.getState()?.material).toEqual(mockMaterial);

    useMaterialPreview.getState()?.closePreview();
    expect(useMaterialPreview.getState()?.material).toBeNull();
  });
});
