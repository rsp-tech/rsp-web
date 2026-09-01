import { create } from "kosha";

interface AdminBypassStore {
  isBypassed: boolean;
  setIsBypassed: (isBypassed: boolean) => void;
  toggleAdminBypass: () => void;
}

export const useAdminBypass = create<AdminBypassStore>((set) => ({
  isBypassed: false,
  setIsBypassed: (isBypassed: boolean) => set({ isBypassed }),
  toggleAdminBypass: () => set((state) => ({ isBypassed: !state.isBypassed })),
}));
