/* Demo photos, effect / weather catalogues and normalisers (port of prototype/photo-frame/app.js). */
import { Image as RNImage } from "react-native";
import { t } from "@/i18n";
import type { EffectType, Motion, Photo, PhotoSource, WeatherPreset } from "./types";

/* Family album (2026-09-15): 16 photos, newest first. */
const familyImages = [
  require("@/assets/images/lucky/family/family-01.jpg"),
  require("@/assets/images/lucky/family/family-02.jpg"),
  require("@/assets/images/lucky/family/family-03.jpg"),
  require("@/assets/images/lucky/family/family-04.jpg"),
  require("@/assets/images/lucky/family/family-05.jpg"),
  require("@/assets/images/lucky/family/family-06.jpg"),
  require("@/assets/images/lucky/family/family-07.jpg"),
  require("@/assets/images/lucky/family/family-08.jpg"),
  require("@/assets/images/lucky/family/family-09.jpg"),
  require("@/assets/images/lucky/family/family-10.jpg"),
  require("@/assets/images/lucky/family/family-11.jpg"),
  require("@/assets/images/lucky/family/family-12.jpg"),
  require("@/assets/images/lucky/family/family-13.jpg"),
  require("@/assets/images/lucky/family/family-14.jpg"),
  require("@/assets/images/lucky/family/family-15.jpg"),
  require("@/assets/images/lucky/family/family-16.jpg"),
];

const FAMILY_META: { id: string; title: string; capturedAt: string; owner: string; motion?: { subject: string; depth: string; motion: string; generatedAt: string } }[] = [
  { id: "sandcastle", title: "堆沙堡的下午", capturedAt: "今天・14:10", owner: "James", motion: { subject: "4 位家人", depth: "前後三層", motion: "人物自然微動", generatedAt: "剛剛" } },
  { id: "waves", title: "追浪花", capturedAt: "今天・14:35", owner: "Sophia" },
  { id: "sunset-walk", title: "夕陽散步", capturedAt: "昨天・18:20", owner: "James" },
  { id: "hand-in-hand", title: "牽手漫步沙灘", capturedAt: "昨天・18:05", owner: "Sophia" },
  { id: "trail-map", title: "看地圖找路", capturedAt: "9 月 13 日・10:15", owner: "James" },
  { id: "picnic-view", title: "山頂野餐", capturedAt: "9 月 13 日・12:40", owner: "Sophia" },
  { id: "waterfall-wide", title: "瀑布探險", capturedAt: "9 月 12 日・15:00", owner: "James" },
  { id: "waterfall-close", title: "看瀑布", capturedAt: "9 月 12 日・15:05", owner: "Sophia" },
  { id: "campfire-day", title: "營火棉花糖", capturedAt: "9 月 6 日・19:20", owner: "James" },
  { id: "tent-day", title: "帳篷裡的笑聲", capturedAt: "9 月 6 日・17:30", owner: "Sophia" },
  { id: "campfire-night", title: "夜晚的營火", capturedAt: "9 月 5 日・20:10", owner: "James" },
  { id: "tent-sunset", title: "帳篷看夕陽", capturedAt: "9 月 5 日・18:45", owner: "Sophia" },
  { id: "dock", title: "湖邊碼頭", capturedAt: "8 月 30 日・18:00", owner: "James" },
  { id: "tree-story", title: "樹上說故事", capturedAt: "8 月 24 日・16:30", owner: "Sophia" },
  { id: "cobblestone", title: "石板路散步", capturedAt: "8 月 18 日・09:15", owner: "James" },
  { id: "bridge-selfie", title: "橋上自拍", capturedAt: "8 月 10 日・19:00", owner: "Sophia", motion: { subject: "3 位家人", depth: "前後兩層", motion: "人物自然微動", generatedAt: "昨天" } },
];

export const MOTION_SECONDS = 5;

export function demoPhotos(): Photo[] {
  return FAMILY_META.map((meta, index) => {
    const src = familyImages[index];
    return {
      id: meta.id,
      title: meta.title,
      capturedAt: meta.capturedAt,
      owner: meta.owner,
      src,
      uploaded: false,
      motion: meta.motion
        ? {
            kind: "demo",
            effectType: "action-extension",
            weatherPreset: "",
            durationSeconds: MOTION_SECONDS,
            videoUrl: "",
            posterUrl: src,
            analysis: { subject: meta.motion.subject, depth: meta.motion.depth, motion: meta.motion.motion },
            generatedAt: meta.motion.generatedAt,
          }
        : null,
    };
  });
}

export const EFFECT_LABELS: Record<EffectType, string> = {
  "action-extension": "動作延伸",
  "weather-transition": "天氣變化",
};

export const WEATHER_PRESETS: Record<WeatherPreset, { label: string; icon: string }> = {
  sunlight: { label: "陽光流動", icon: "sun" },
  clouds: { label: "雲層掠過", icon: "cloud" },
  rain: { label: "細雨落下", icon: "cloud-rain" },
  snow: { label: "飄雪", icon: "snowflake" },
};
export const WEATHER_ORDER: WeatherPreset[] = ["sunlight", "clouds", "rain", "snow"];

/** Display devices offered in the settings dialog (source strings). */
export const DEVICE_OPTIONS = ["餐桌日曆機", "客廳相框", "臥室螢幕"];

/* The device bridge in the prototype also accepted the shell's short aliases. */
const EFFECT_ALIASES: Record<string, EffectType> = { motion: "action-extension", weather: "weather-transition" };
const WEATHER_ALIASES: Record<string, WeatherPreset> = { sunny: "sunlight", cloudy: "clouds", rainy: "rain", snowy: "snow" };

export function normalizedEffectType(value: unknown): EffectType {
  const mapped = typeof value === "string" ? EFFECT_ALIASES[value] || value : value;
  return mapped === "weather-transition" ? "weather-transition" : "action-extension";
}

export function normalizedWeatherPreset(value: unknown): WeatherPreset {
  const mapped = typeof value === "string" ? WEATHER_ALIASES[value] || value : value;
  return typeof mapped === "string" && Object.prototype.hasOwnProperty.call(WEATHER_PRESETS, mapped) ? (mapped as WeatherPreset) : "clouds";
}

export const motionLabel = (motion: Pick<Motion, "effectType"> | null | undefined) => t(EFFECT_LABELS[normalizedEffectType(motion?.effectType)]);
export const weatherLabel = (preset: unknown) => t(WEATHER_PRESETS[normalizedWeatherPreset(preset)].label);
export const motionIcon = (motion: Pick<Motion, "effectType"> | null | undefined) => (normalizedEffectType(motion?.effectType) === "weather-transition" ? "cloud" : "sparkles");

/** expo-image `source` for a bundled asset (require() result) or a URI string.
 * A require() result is already a valid RN image source as-is (a numeric asset id on native,
 * or an asset object on web) — only a plain string needs wrapping into `{ uri }`. */
export const imageSource = (src: PhotoSource) => (typeof src === "string" ? { uri: src } : src);

/** Best-effort URI for a photo source (used when posting the original to the AI endpoint). */
export function sourceUri(src: PhotoSource): string {
  if (typeof src === "string") return src;
  try {
    return RNImage.resolveAssetSource(src)?.uri || "";
  } catch {
    return "";
  }
}
