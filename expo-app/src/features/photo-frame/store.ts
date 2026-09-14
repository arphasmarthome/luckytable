/* Photo frame state: the photo list, selection, cinema mode and the AI run.
 * Playback / effect preferences live in the shared device store (single source of truth). */
import { create } from "zustand";
import { useDeviceStore } from "@/store/device";
import { demoPhotos } from "./data";
import type { AiState, Motion, Photo } from "./types";

export type FrameState = {
  photos: Photo[];
  selectedId: string;
  /** Stage shown edge-to-edge over the app (browser fullscreen when available, otherwise the "cinema" fallback). */
  cinema: boolean;
  ai: AiState | null;
  /** Display device chosen in settings (source string). */
  device: string;
};

export const useFrameStore = create<FrameState>()(() => ({
  photos: demoPhotos(),
  selectedId: "tea",
  cinema: false,
  ai: null,
  device: "餐桌日曆機",
}));

/** Keep Settings → 相框 counters in step with the photo list. */
function syncCounts(photos: Photo[]) {
  const photoCount = photos.length;
  const motionCount = photos.filter((photo) => photo.motion).length;
  const device = useDeviceStore.getState();
  if (device.photoCount !== photoCount || device.motionCount !== motionCount) useDeviceStore.setState({ photoCount, motionCount });
}
syncCounts(useFrameStore.getState().photos);
useFrameStore.subscribe((state, previous) => {
  if (state.photos !== previous.photos) syncCounts(state.photos);
});

export function currentPhoto(state: FrameState = useFrameStore.getState()): Photo | null {
  return state.photos.find((photo) => photo.id === state.selectedId) || state.photos[0] || null;
}

export function photoById(id: string | null | undefined, state: FrameState = useFrameStore.getState()): Photo | null {
  return state.photos.find((photo) => photo.id === id) || null;
}

export function shouldPlayMotion(photo: Photo | null = currentPhoto()) {
  return Boolean(photo?.motion && useDeviceStore.getState().settings.autoPlayMotion);
}

export const frame = {
  selectPhoto(id: string) {
    const state = useFrameStore.getState();
    if (!state.photos.some((photo) => photo.id === id)) return;
    useFrameStore.setState({ selectedId: id });
  },
  changePhoto(direction: 1 | -1) {
    const state = useFrameStore.getState();
    if (!state.photos.length) return;
    const currentIndex = Math.max(
      0,
      state.photos.findIndex((photo) => photo.id === state.selectedId),
    );
    const nextIndex = (currentIndex + direction + state.photos.length) % state.photos.length;
    useFrameStore.setState({ selectedId: state.photos[nextIndex].id });
  },
  addPhoto(photo: Photo) {
    useFrameStore.setState((state) => ({ photos: [photo, ...state.photos], selectedId: photo.id }));
  },
  /** Removes the selected photo and returns it (null when the list was empty). */
  removeSelected(): Photo | null {
    const state = useFrameStore.getState();
    const photo = currentPhoto(state);
    if (!photo) return null;
    const index = state.photos.indexOf(photo);
    const photos = state.photos.filter((item) => item !== photo);
    useFrameStore.setState({ photos, selectedId: photos[Math.min(index, photos.length - 1)]?.id || "" });
    return photo;
  },
  setMotion(photoId: string, motion: Motion | null) {
    useFrameStore.setState((state) => ({ photos: state.photos.map((photo) => (photo.id === photoId ? { ...photo, motion } : photo)) }));
  },
  setCinema(cinema: boolean) {
    if (useFrameStore.getState().cinema !== cinema) useFrameStore.setState({ cinema });
  },
  setAi(ai: AiState | null) {
    useFrameStore.setState({ ai });
  },
  patchAi(patch: Partial<AiState>) {
    const ai = useFrameStore.getState().ai;
    if (ai) useFrameStore.setState({ ai: { ...ai, ...patch } });
  },
  setDevice(device: string) {
    useFrameStore.setState({ device });
  },
};
