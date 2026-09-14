import type { ReactNode } from "react";
import { create } from "zustand";

export type DialogOptions = {
  title: string;
  /** Static content, or a render function (a component) so the body re-renders with store changes. */
  body?: ReactNode | (() => ReactNode);
  footer?: ReactNode | (() => ReactNode);
  /** 760 px wide by default; `wide` allows up to 1100 px. */
  wide?: boolean;
  onClose?: () => void;
};

type DialogStore = { current: DialogOptions | null; show: (options: DialogOptions) => void; close: () => void };

export const useDialogStore = create<DialogStore>((set, get) => ({
  current: null,
  show(options) {
    set({ current: options });
  },
  close() {
    const onClose = get().current?.onClose;
    set({ current: null });
    onClose?.();
  },
}));

/** Open / close the single app-level dialog (same role as the prototype's <dialog id="appDialog">). */
export const dialog = {
  show: (options: DialogOptions) => useDialogStore.getState().show(options),
  close: () => useDialogStore.getState().close(),
  isOpen: () => useDialogStore.getState().current !== null,
};
