import * as Lucide from "lucide-react-native/icons";
import type { ComponentType } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import { shell } from "@/theme";

type LucideIcon = ComponentType<{ size?: number; color?: string; strokeWidth?: number; style?: StyleProp<ViewStyle>; absoluteStrokeWidth?: boolean }>;
const registry = Lucide as unknown as Record<string, LucideIcon>;
const cache: Record<string, LucideIcon> = {};

/** Resolve a lucide icon by its kebab-case name (the names the prototype used, e.g. "chef-hat", "columns-2"). */
export function iconComponent(name: string): LucideIcon {
  if (cache[name]) return cache[name];
  const key = name
    .split("-")
    .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : ""))
    .join("");
  const found = registry[key] || registry[`${key}Icon`] || registry.Circle;
  cache[name] = found;
  return found;
}

export type IconProps = { name: string; size?: number; color?: string; strokeWidth?: number; style?: StyleProp<ViewStyle> };

export function Icon({ name, size = 20, color = shell.ink, strokeWidth = 1.8, style }: IconProps) {
  const Component = iconComponent(name);
  return <Component size={size} color={color} strokeWidth={strokeWidth} style={style} />;
}
