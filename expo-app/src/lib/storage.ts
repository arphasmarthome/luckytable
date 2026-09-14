import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { createJSONStorage } from "zustand/middleware";

const isWeb = Platform.OS === "web";

function webStorage(): Storage | null {
  try {
    return typeof window !== "undefined" && window.localStorage ? window.localStorage : null;
  } catch {
    return null;
  }
}

/** Synchronous read; only available on web (returns null elsewhere). */
export function getItemSync(key: string): string | null {
  const store = webStorage();
  if (!store) return null;
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}

export async function getItem(key: string): Promise<string | null> {
  if (isWeb) return getItemSync(key);
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

export async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    const store = webStorage();
    try {
      store?.setItem(key, value);
    } catch {
      /* storage unavailable */
    }
    return;
  }
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    /* storage unavailable */
  }
}

export async function removeItem(key: string): Promise<void> {
  if (isWeb) {
    try {
      webStorage()?.removeItem(key);
    } catch {
      /* ignore */
    }
    return;
  }
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

/** Synchronous JSON read on web; falls back to `fallback` on native (hydrate async there). */
export function loadJSON<T>(key: string, fallback: T): T {
  const raw = getItemSync(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export async function loadJSONAsync<T>(key: string, fallback: T): Promise<T> {
  const raw = await getItem(key);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown) {
  void setItem(key, JSON.stringify(value));
}

/** Storage adapter for zustand's `persist` middleware: synchronous localStorage on web, AsyncStorage on native. */
export const zustandStorage = createJSONStorage(() => (isWeb ? (webStorage() as Storage) : AsyncStorage));
