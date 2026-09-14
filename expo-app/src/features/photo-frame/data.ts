/* Demo photos, effect / weather catalogues and normalisers (port of prototype/photo-frame/app.js). */
import { Image as RNImage } from "react-native";
import { t } from "@/i18n";
import type { EffectType, Motion, Photo, PhotoSource, WeatherPreset } from "./types";

const teaImage = require("@/assets/images/lucky/family-tea.png");
const sofaImage = require("@/assets/images/lucky/family-sofa.png");
const laughterImage = require("@/assets/images/lucky/family-laughter.png");
const reunionImage = require("@/assets/images/lucky/family-reunion.png");

export const MOTION_SECONDS = 5;

export function demoPhotos(): Photo[] {
  return [
    {
      id: "tea",
      title: "週末午後",
      capturedAt: "今天・14:20",
      owner: "James",
      src: teaImage,
      uploaded: false,
      motion: {
        kind: "demo",
        effectType: "action-extension",
        weatherPreset: "",
        durationSeconds: MOTION_SECONDS,
        videoUrl: "",
        posterUrl: teaImage,
        analysis: { subject: "4 位家人", depth: "前後三層", motion: "人物自然微動" },
        generatedAt: "剛剛",
      },
    },
    { id: "sofa", title: "一起窩在沙發", capturedAt: "8 月 31 日・20:12", owner: "miles", src: sofaImage, uploaded: false, motion: null },
    { id: "laughter", title: "笑成一團", capturedAt: "8 月 24 日・16:45", owner: "大家好", src: laughterImage, uploaded: false, motion: null },
    {
      id: "reunion",
      title: "全家都到齊",
      capturedAt: "8 月 18 日・12:30",
      owner: "James",
      src: reunionImage,
      uploaded: false,
      motion: {
        kind: "demo",
        effectType: "action-extension",
        weatherPreset: "",
        durationSeconds: MOTION_SECONDS,
        videoUrl: "",
        posterUrl: reunionImage,
        analysis: { subject: "6 位家人", depth: "前後三層", motion: "人物自然微動" },
        generatedAt: "昨天",
      },
    },
  ];
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
