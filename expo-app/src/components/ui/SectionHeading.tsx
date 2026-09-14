import type { ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { Button } from "./Button";
import { Txt } from "./Txt";

export function SectionHeading({ title, subtitle, action, children, style, level = "h2" }: { title: string; subtitle?: string; action?: { label: string; onPress: () => void; icon?: string }; children?: ReactNode; style?: StyleProp<ViewStyle>; level?: "h1" | "h2" | "h3" }) {
  return (
    <View style={[{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12, marginBottom: 16 }, style]}>
      <View style={{ flex: 1, minWidth: 160 }}>
        <Txt variant={level}>{title}</Txt>
        {subtitle ? (
          <Txt variant="meta" muted>
            {subtitle}
          </Txt>
        ) : null}
      </View>
      {action ? <Button variant="text" size="sm" label={action.label} iconRight={action.icon ?? "arrow-right"} onPress={action.onPress} /> : null}
      {children}
    </View>
  );
}
