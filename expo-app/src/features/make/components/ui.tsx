/* Small Make-themed building blocks shared by the Make screens (photo boxes, measured grids,
 * kickers, progress bars, steppers) — layout intent from prototype/make/styles.css. */
import { Image } from "expo-image";
import { Children, useEffect, useRef, useState, type ReactNode } from "react";
import { Animated, Pressable, View, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";
import { Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { make, radius } from "@/theme";
import type { ComponentProps } from "react";

export const PHOTO_BG = "#f1f1ef";

/** Txt with the Make module's ink / muted colours. */
export function MTxt({ color, muted, ...rest }: ComponentProps<typeof Txt>) {
  return <Txt color={color ?? (muted ? make.muted : make.foreground)} {...rest} />;
}

/** Uppercase caption label above a card block (the prototype's .card-kicker). */
export function Kicker({ children }: { children: string }) {
  return (
    <MTxt variant="caption" weight="600" muted style={{ textTransform: "uppercase", letterSpacing: 1 }}>
      {children}
    </MTxt>
  );
}

/** Remote photo on a neutral placeholder; `children` are overlaid (badges, captions). */
export function Photo({ uri, height, aspectRatio, round = radius.lg, contentFit = "cover", style, children }: { uri?: string; height?: number; aspectRatio?: number; round?: number; contentFit?: "cover" | "contain"; style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  return (
    <View style={[{ position: "relative", overflow: "hidden", borderRadius: round, backgroundColor: PHOTO_BG, height, aspectRatio, width: "100%", maxWidth: "100%" }, style]}>
      {uri ? <Image source={{ uri }} contentFit={contentFit} transition={150} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} accessibilityIgnoresInvertColors /> : null}
      {children}
    </View>
  );
}

/** Wrapping grid with `cols` equal columns; measures its own width so cards keep exact widths. */
export function Grid({ cols, gap = 16, children, style }: { cols: number; gap?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const [width, setWidth] = useState(0);
  const items = Children.toArray(children);
  const n = Math.max(1, cols);
  const itemWidth = width ? Math.floor((width - gap * (n - 1)) / n) : undefined;
  return (
    <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} style={[{ flexDirection: "row", flexWrap: "wrap", gap, width: "100%" }, style]}>
      {items.map((child, i) => (
        <View key={i} style={{ width: itemWidth ?? "100%", opacity: itemWidth ? 1 : 0 }}>
          {child}
        </View>
      ))}
    </View>
  );
}

/** Column count for dish grids: 1–2 on phone, 3 on tablet, 4 on desktop. */
export function useGridCols(min = 300) {
  const { width, isPhone, isDesktop } = useBreakpoint();
  if (isPhone) return width < 560 ? 1 : 2;
  if (isDesktop) return Math.max(3, Math.min(4, Math.floor((width - 260) / min)));
  return 3;
}

/** Progress bar that eases to its new value whenever `pct` changes. */
export function Bar({ pct, color = make.green, height = 16, track = make.border }: { pct: number; color?: string; height?: number; track?: string }) {
  const clamped = Math.max(0, Math.min(100, pct));
  const anim = useRef(new Animated.Value(clamped)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: clamped, duration: 550, useNativeDriver: false }).start();
  }, [anim, clamped]);
  const width = anim.interpolate({ inputRange: [0, 100], outputRange: ["0%", "100%"] });
  return (
    <View style={{ height, borderRadius: radius.pill, backgroundColor: track, overflow: "hidden", width: "100%" }} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}>
      <Animated.View style={{ height: "100%", width, backgroundColor: color, borderRadius: radius.pill }} />
    </View>
  );
}

/** − n + stepper with round buttons (the prototype's .stepper). */
export function Stepper({ value, onDelta, size = 48 }: { value: number; onDelta: (delta: number) => void; size?: number }) {
  const { fs } = useBreakpoint();
  const btn = (label: string, delta: number, plus?: boolean) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={() => onDelta(delta)}
      style={({ pressed }) => ({ width: size, height: size, borderRadius: size / 2, borderWidth: 1, borderColor: plus ? make.selectedBorder : make.border, backgroundColor: plus ? make.primarySoft : make.surface, alignItems: "center", justifyContent: "center", opacity: pressed ? 0.7 : 1 })}>
      <MTxt variant="h2" weight="600" color={plus ? make.primaryPressed : make.foreground} style={{ lineHeight: size - 4 }}>
        {label}
      </MTxt>
    </Pressable>
  );
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
      {btn("−", -1)}
      <MTxt weight="600" style={{ minWidth: 34, textAlign: "center", fontSize: fs("section"), lineHeight: fs("section") * 1.3 }}>
        {String(value)}
      </MTxt>
      {btn("+", 1, true)}
    </View>
  );
}

/** Small round number / check marker. */
export function NumDot({ children, size = 36, color = make.primary, fg = "#fff" }: { children: ReactNode; size?: number; color?: string; fg?: string }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, alignItems: "center", justifyContent: "center" }}>
      {typeof children === "string" || typeof children === "number" ? (
        <MTxt variant="meta" weight="700" color={fg}>
          {String(children)}
        </MTxt>
      ) : (
        children
      )}
    </View>
  );
}

/** Pill tag (the prototype's .tag / .tag-green). */
export function Tag({ children, green }: { children: string; green?: boolean }) {
  return (
    <View style={{ alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: green ? make.greenSoft : make.surface2 }}>
      <MTxt variant="caption" weight="600" color={green ? "#2f6a55" : make.muted} style={{ textTransform: "uppercase", letterSpacing: 0.5 }}>
        {children}
      </MTxt>
    </View>
  );
}

/** Card with the Make border / radius (12 px panel). */
export function MCard({ children, style, background = make.surface, border = make.border, padding = 20, gap = 12 }: { children: ReactNode; style?: StyleProp<ViewStyle>; background?: string; border?: string; padding?: number; gap?: number }) {
  return <View style={[{ backgroundColor: background, borderColor: border, borderWidth: 1, borderRadius: radius.lg, padding, gap, minWidth: 0 }, style]}>{children}</View>;
}
