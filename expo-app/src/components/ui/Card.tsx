import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { radius, shell } from "@/theme";

export type CardProps = { children?: ReactNode; style?: StyleProp<ViewStyle>; padding?: number; background?: string; border?: string; gap?: number };

export function Card({ children, style, padding = 20, background = shell.surface, border = shell.line, gap }: CardProps) {
  return <View style={[{ backgroundColor: background, borderColor: border, borderWidth: 1, borderRadius: radius.md, padding, gap }, style]}>{children}</View>;
}
