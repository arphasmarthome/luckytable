/* Family photo upload for the cooking summary — web file picker, downscaled so it fits local storage. */
import { Platform } from "react-native";

const MAX_EDGE = 1024;

export function pickImage(): Promise<string | null> {
  if (Platform.OS !== "web" || typeof document === "undefined") return Promise.resolve(null);
  return new Promise((resolve) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return resolve(null);
      const url = URL.createObjectURL(file);
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, MAX_EDGE / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d")?.drawImage(img, 0, 0, canvas.width, canvas.height);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.onerror = () => resolve(null);
      img.src = url;
    };
    input.click();
  });
}
