/* Adding a photo from a file (port of readPhotoFile). Web only in this demo: a hidden
 * <input type="file"> reads the picture as a data URL; native just explains the limitation. */
import { Platform } from "react-native";
import { t } from "@/i18n";
import { toast } from "@/store/toast";
import { frame } from "./store";
import type { Photo } from "./types";

const MAX_BYTES = 20 * 1024 * 1024;
let input: HTMLInputElement | null = null;

function readPhotoFile(file: File | null | undefined) {
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    toast(t("請選擇照片檔案。"));
    return;
  }
  if (file.size > MAX_BYTES) {
    toast(t("照片需小於 20 MB。"));
    return;
  }
  const reader = new FileReader();
  reader.onerror = () => toast(t("無法讀取這張照片，請重新上傳後再試。"));
  reader.onload = () => {
    const src = typeof reader.result === "string" ? reader.result : "";
    if (!src) return;
    const title = file.name.replace(/\.[^.]+$/, "").trim().slice(0, 32) || t("新加入的照片");
    const photo: Photo = {
      id: `upload-${Date.now()}`,
      title,
      capturedAt: "剛剛",
      owner: "這台裝置",
      src,
      fileName: file.name,
      uploaded: true,
      motion: null,
    };
    frame.addPhoto(photo);
    toast(t("已加入「{title}」，可選擇 AI 美化。", { title }));
  };
  reader.readAsDataURL(file);
}

function fileInput(): HTMLInputElement | null {
  if (typeof document === "undefined") return null;
  if (input && input.isConnected) return input;
  input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";
  input.hidden = true;
  input.setAttribute("aria-hidden", "true");
  input.addEventListener("change", () => {
    readPhotoFile(input?.files?.[0]);
    if (input) input.value = "";
  });
  document.body.appendChild(input);
  return input;
}

/** Open the platform picker. Returns false when uploading is unavailable on this platform. */
export function pickPhoto(): boolean {
  if (Platform.OS !== "web") {
    toast(t("此示範僅支援在網頁版加入照片。"));
    return false;
  }
  const element = fileInput();
  if (!element) return false;
  element.click();
  return true;
}
