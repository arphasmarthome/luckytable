/* Fullscreen (port of toggleFullscreen): browser fullscreen on web when the API is available,
 * otherwise the "cinema" fallback — the stage is shown edge-to-edge over the app. */
import { useEffect } from "react";
import { Platform } from "react-native";
import { currentPhoto, frame, useFrameStore } from "./store";

function fullscreenDocument(): Document | null {
  return Platform.OS === "web" && typeof document !== "undefined" ? document : null;
}

export function isBrowserFullscreen() {
  const doc = fullscreenDocument();
  return Boolean(doc?.fullscreenElement);
}

export async function exitFullscreen() {
  frame.setCinema(false);
  const doc = fullscreenDocument();
  if (doc?.fullscreenElement) {
    try {
      await doc.exitFullscreen();
    } catch {
      /* already left */
    }
  }
}

export async function toggleFullscreen() {
  if (!currentPhoto()) return;
  if (useFrameStore.getState().cinema || isBrowserFullscreen()) {
    await exitFullscreen();
    return;
  }
  frame.setCinema(true);
  const doc = fullscreenDocument();
  if (!doc?.documentElement?.requestFullscreen) return; // cinema fallback only
  try {
    await doc.documentElement.requestFullscreen();
  } catch {
    /* the browser refused (no user gesture, iframe policy…) — cinema fallback stays on */
  }
}

/** Leaves cinema mode when the browser exits fullscreen on its own (Esc, browser UI). */
export function useFullscreenSync() {
  useEffect(() => {
    const doc = fullscreenDocument();
    if (!doc) return;
    const onChange = () => {
      if (!doc.fullscreenElement) frame.setCinema(false);
    };
    doc.addEventListener("fullscreenchange", onChange);
    return () => doc.removeEventListener("fullscreenchange", onChange);
  }, []);
}
