import type { ReactNode } from "react";
import { ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { shell } from "@/theme";

/** Content area of a local module: scrolls vertically, keeps the prototype's page inset. */
export function Page({ children, scroll = true, padded = true, background = shell.canvas, style, contentStyle, gap = 24, inset: insetOverride }: { children: ReactNode; scroll?: boolean; padded?: boolean; background?: string; style?: StyleProp<ViewStyle>; contentStyle?: StyleProp<ViewStyle>; gap?: number; inset?: number }) {
  const { inset } = useBreakpoint();
  const padding = padded ? insetOverride ?? inset : 0;
  if (!scroll) return <View style={[{ flex: 1, backgroundColor: background, padding, gap }, style]}>{children}</View>;
  return (
    <ScrollView style={[{ flex: 1, backgroundColor: background }, style]} contentContainerStyle={[{ padding, gap, flexGrow: 1 }, contentStyle]} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}
