import { create } from "zustand";

type ToastStore = { message: string; visible: boolean; show: (message: string) => void; hide: () => void };
let timer: ReturnType<typeof setTimeout> | undefined;

export const useToastStore = create<ToastStore>((set) => ({
  message: "",
  visible: false,
  show(message) {
    if (timer) clearTimeout(timer);
    set({ message, visible: true });
    timer = setTimeout(() => set({ visible: false }), 3600);
  },
  hide() {
    if (timer) clearTimeout(timer);
    set({ visible: false });
  },
}));

/** Show a short status message (same role as the prototype's toast region). */
export const toast = (message: string) => useToastStore.getState().show(message);
