import { STORE } from "@/constants";
import type { EnrichedRecording } from "@/types";
import { enforceLRUWatermark, touchTrackMeta } from "./audio-idb-ledger";
import { getDB } from "./idb";

export interface AudioState {
  currentAudioId: string | null;
  currentRecording: EnrichedRecording | null;
  categoryPath: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
}

type Listener = () => void;

let state: AudioState = {
  currentAudioId: null,
  currentRecording: null,
  categoryPath: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  playbackRate: 1,
};

const listeners = new Set<Listener>();
let audioEl: HTMLAudioElement | null = null;
let currentObjectUrl: string | null = null;

const emit = () =>
  listeners.forEach((l) => {
    l();
  });

const getAudioElement = (): HTMLAudioElement => {
  if (!audioEl && typeof window !== "undefined") {
    audioEl = new Audio();

    audioEl.addEventListener("timeupdate", () => {
      state = { ...state, currentTime: audioEl?.currentTime ?? 0 };
      emit();
    });
    audioEl.addEventListener("play", () => {
      state = { ...state, isPlaying: true };
      emit();
    });
    audioEl.addEventListener("pause", () => {
      state = { ...state, isPlaying: false };
      emit();
    });
    audioEl.addEventListener("durationchange", () => {
      state = { ...state, duration: audioEl?.duration ?? 0 };
      emit();
    });
  }
  return audioEl as HTMLAudioElement;
};

export const audioEngine = {
  subscribe: (listener: Listener) => {
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  },

  getSnapshot: (): AudioState => state,

  playTrack: async (
    audioId: string,
    rec: EnrichedRecording,
    blob: Blob,
    maxCacheSizeMB?: number,
  ) => {
    const audio = getAudioElement();
    audio.pause();

    // Prevent Object URL memory leakage explicitly
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
    }

    currentObjectUrl = URL.createObjectURL(blob);

    let categoryPathVal: string | null = null;
    try {
      const db = await getDB();
      if (db && rec.category_id) {
        const cat = await db.get(STORE.CATEGORIES, rec.category_id);
        if (cat) {
          categoryPathVal = cat.url_path;
        }
      }
    } catch (e) {
      console.error("Failed to fetch category from IndexedDB:", e);
    }

    state = {
      ...state,
      currentAudioId: audioId,
      currentRecording: rec,
      categoryPath: categoryPathVal,
      currentTime: 0,
    };
    emit();

    audio.src = currentObjectUrl;
    audio.playbackRate = state.playbackRate;
    audio.volume = state.volume;

    await audio.play();

    // Update metadata asynchronously off the main thread path
    await touchTrackMeta(audioId, rec.id, blob.size);
    await enforceLRUWatermark(maxCacheSizeMB);
  },

  togglePlay: () => {
    const audio = getAudioElement();
    if (!state.currentAudioId) return;
    if (state.isPlaying) audio.pause();
    else audio.play().catch(console.error);
  },

  dismiss: () => {
    const audio = getAudioElement();
    audio.pause();
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
      currentObjectUrl = null;
    }
    audio.src = "";
    state = {
      ...state,
      currentAudioId: null,
      currentRecording: null,
      categoryPath: null,
      isPlaying: false,
      currentTime: 0,
      duration: 0,
    };
    emit();
  },

  seek: (time: number) => {
    const audio = getAudioElement();
    audio.currentTime = time;
  },

  setVolume: (vol: number) => {
    const audio = getAudioElement();
    audio.volume = vol;
    state = { ...state, volume: vol };
    emit();
  },

  setRate: (rate: number) => {
    const audio = getAudioElement();
    audio.playbackRate = rate;
    state = { ...state, playbackRate: rate };
    emit();
  },
};
