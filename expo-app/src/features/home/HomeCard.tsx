/* Shared frame for the four Home cards (prototype .home-card / .home-card-head / .home-card-foot). */
import type { ReactNode } from "react";
import { ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import { Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { radius, shell } from "@/theme";

export function HomeCard({ title, aside, children, footer, style, accessibilityLabel }: { title: string; aside?: ReactNode; children?: ReactNode; footer?: ReactNode; style?: StyleProp<ViewStyle>; accessibilityLabel?: string }) {
  const { isPhone, isWide } = useBreakpoint();
  return (
    <View accessibilityLabel={accessibilityLabel ?? title} style={[{ minWidth: 0, backgroundColor: shell.surface, borderWidth: 1, borderColor: shell.line, borderRadius: radius.md, padding: isPhone ? 16 : 16, paddingHorizontal: isPhone ? 16 : 20, gap: 10 }, style]}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 10, minHeight: 40 }}>
        <Txt variant="section" style={{ flexShrink: 1 }}>
          {title}
        </Txt>
        {aside}
      </View>
      {isWide ? (
        <ScrollView style={{ flex: 1, minHeight: 0 }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
          {children}
        </ScrollView>
      ) : (
        children
      )}
      {footer ? (
        <View style={{ marginTop: "auto", flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: shell.line }}>
          {footer}
        </View>
      ) : null}
    </View>
  );
}

/** Rounded status pill (.pill / .pill.is-off / .tonight-badge.is-short). */
export function Pill({ label, tone = "green" }: { label: string; tone?: "green" | "off" | "short" }) {
  const palette = tone === "green" ? { bg: shell.greenSoft, fg: shell.green } : tone === "short" ? { bg: "#fbf0df", fg: "#946126" } : { bg: "#f1f3f2", fg: shell.muted };
  return (
    <View style={{ paddingHorizontal: 14, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: palette.bg, alignSelf: "flex-start" }}>
      <Txt variant="meta" weight="600" color={palette.fg}>
        {label}
      </Txt>
    </View>
  );
}
