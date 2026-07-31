import { create } from "kosha";
import type { Material } from "@/types";

interface MaterialPreviewStore {
  material: Material | null;
  openPreview: (material: Material) => void;
  closePreview: () => void;
}

export const useMaterialPreview = create<MaterialPreviewStore>((set) => ({
  material: null,
  openPreview: (material: Material) => set({ material }),
  closePreview: () => set({ material: null }),
}));
