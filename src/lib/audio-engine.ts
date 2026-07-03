import { enforceLRUWatermark, touchTrackMeta } from "./audio-idb-ledger";

export interface AudioState {
  currentAudioId: string | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
}

type Listener = () => void;

let state: AudioState = {
  currentAudioId: null,
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
    recId: string,
    blob: Blob,
    maxCacheSizeMB: number,
  ) => {
    const audio = getAudioElement();
    audio.pause();

    // Prevent Object URL memory leakage explicitly
    if (currentObjectUrl) {
      URL.revokeObjectURL(currentObjectUrl);
    }

    currentObjectUrl = URL.createObjectURL(blob);

    state = { ...state, currentAudioId: audioId, currentTime: 0 };
    emit();

    audio.src = currentObjectUrl;
    audio.playbackRate = state.playbackRate;
    audio.volume = state.volume;

    await audio.play();

    // Update metadata asynchronously off the main thread path
    await touchTrackMeta(audioId, recId, blob.size);
    await enforceLRUWatermark(maxCacheSizeMB);
  },

  togglePlay: () => {
    const audio = getAudioElement();
    if (!state.currentAudioId) return;
    if (state.isPlaying) audio.pause();
    else audio.play().catch(console.error);
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
