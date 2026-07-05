import { create } from "kosha";

interface VideoStore {
  ytId: string;
  title: string;
  setYt: (video: string, title: string) => void;
}

export const useVideo = create<VideoStore>((set) => ({
  ytId: "",
  title: "",
  setYt: (ytId: string, title: string) => set({ ytId, title }),
}));
