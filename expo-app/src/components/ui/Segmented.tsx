import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { radius, shell } from "@/theme";
import { Txt } from "./Txt";

export type SegmentedOption<T extends string> = { value: T; label: string };

export function Segmented<T extends string>({ options, value, onChange, accent = shell.green, size = "md", style, accessibilityLabel }: { options: SegmentedOption<T>[]; value: T; onChange: (value: T) => void; accent?: string; size?: "sm" | "md"; style?: StyleProp<ViewStyle>; accessibilityLabel?: string }) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={[{ flexDirection: "row", borderWidth: 1, borderColor: shell.line, borderRadius: radius.sm, overflow: "hidden", backgroundColor: "#fff", alignSelf: "flex-start" }, style]}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(option.value)}
            style={{ minHeight: size === "sm" ? 40 : 48, paddingHorizontal: size === "sm" ? 14 : 22, justifyContent: "center", backgroundColor: active ? accent : "transparent" }}>
            <Txt variant={size === "sm" ? "meta" : "control"} color={active ? "#fff" : shell.ink} weight={active ? "600" : "500"}>
              {option.label}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );
}
