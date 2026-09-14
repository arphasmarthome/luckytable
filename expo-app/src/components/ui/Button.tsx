import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { radius, shell, tint } from "@/theme";
import { Icon } from "./Icon";
import { Txt } from "./Txt";

export type ButtonVariant = "primary" | "secondary" | "text" | "soft" | "danger" | "ghost";
export type ButtonSize = "sm" | "md" | "lg" | "xl";

export type ButtonProps = {
  label?: string;
  icon?: string;
  iconRight?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  /** Primary colour; defaults to the shell green. Pass make.primary inside the Make module. */
  accent?: string;
  /** Text colour for primary buttons */
  onAccent?: string;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  /** Extra content rendered after the label (e.g. a count badge). */
  children?: ReactNode;
  /** Square icon-only button */
  square?: boolean;
  /** Fully rounded */
  round?: boolean;
  block?: boolean;
  testID?: string;
};

const HEIGHT: Record<ButtonSize, number> = { sm: 40, md: 48, lg: 56, xl: 64 };

export function Button({ label, icon, iconRight, onPress, variant = "secondary", size = "md", disabled, accent = shell.green, onAccent = "#fff", style, accessibilityLabel, children, square, round, block, testID }: ButtonProps) {
  const { fs } = useBreakpoint();
  const height = HEIGHT[size];
  const fontSize = size === "sm" ? fs("meta") : size === "xl" ? fs("card") : fs("control");
  const iconSize = Math.round(fontSize * 1.05);
  const soft = tint(accent, 0.12);
  const palette = {
    primary: { bg: accent, border: accent, fg: onAccent },
    secondary: { bg: "#fff", border: shell.line, fg: shell.ink },
    text: { bg: "transparent", border: "transparent", fg: accent },
    ghost: { bg: "transparent", border: "transparent", fg: shell.ink },
    soft: { bg: soft, border: tint(accent, 0.35), fg: accent },
    danger: { bg: "#fff", border: tint(shell.danger, 0.4), fg: shell.danger },
  }[variant];
  const isIconOnly = square || (!label && !children);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.base,
        {
          minHeight: height,
          height: isIconOnly ? height : undefined,
          width: isIconOnly ? height : undefined,
          paddingHorizontal: isIconOnly ? 0 : size === "sm" ? 12 : 18,
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderRadius: round ? radius.pill : radius.sm,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
          alignSelf: block ? "stretch" : undefined,
        },
        style,
      ]}>
      {icon ? <Icon name={icon} size={iconSize} color={palette.fg} /> : null}
      {label ? (
        <Txt variant={size === "sm" ? "meta" : size === "xl" ? "card" : "control"} color={palette.fg} weight="500" numberOfLines={2} style={styles.label}>
          {label}
        </Txt>
      ) : null}
      {children ? <View style={styles.extra}>{children}</View> : null}
      {iconRight ? <Icon name={iconRight} size={iconSize} color={palette.fg} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, borderWidth: 1 },
  label: { flexShrink: 1 },
  extra: { flexDirection: "row", alignItems: "center" },
});
