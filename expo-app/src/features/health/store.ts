/* Module-local UI state of 健康 that the shared device store does not model:
 * the prototype kept `health.autoConnect` next to the wearables. */
import { create } from "zustand";

type HealthUiStore = { autoConnect: boolean; setAutoConnect: (value: boolean) => void };

export const useHealthUiStore = create<HealthUiStore>((set) => ({ autoConnect: true, setAutoConnect: (autoConnect) => set({ autoConnect }) }));
