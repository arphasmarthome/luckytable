import { useEffect, useRef } from "react";
import { Animated, Pressable, View } from "react-native";
import { shell } from "@/theme";
import { Txt } from "./Txt";

const YES_COLOR = shell.green;
/** Deliberately not red/green-adjacent so "No" reads as neutral, not alarming. */
const NO_COLOR = "#8a94a6";

export type YesNoSliderProps = {
  value: boolean;
  onChange: (value: boolean) => void;
  yesLabel: string;
  noLabel: string;
  accessibilityLabel?: string;
  width?: number;
  height?: number;
};

/** Two-state pill with a sliding, colour-coded thumb (green = yes, slate = no) — tap either half to set it. */
export function YesNoSlider({ value, onChange, yesLabel, noLabel, accessibilityLabel, width = 92, height = 36 }: YesNoSliderProps) {
  const anim = useRef(new Animated.Value(value ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(anim, { toValue: value ? 1 : 0, duration: 200, useNativeDriver: false }).start();
  }, [anim, value]);
  const half = width / 2;
  const translateX = anim.interpolate({ inputRange: [0, 1], outputRange: [0, half] });
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={accessibilityLabel} style={{ width, height, borderRadius: height / 2, backgroundColor: "#eef0ee", borderWidth: 1, borderColor: shell.line, overflow: "hidden" }}>
      <Animated.View pointerEvents="none" style={{ position: "absolute", top: -1, bottom: -1, left: -1, width: half + 1, borderRadius: height / 2, backgroundColor: value ? YES_COLOR : NO_COLOR, transform: [{ translateX }] }} />
      <View style={{ flex: 1, flexDirection: "row" }}>
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ selected: value }}
          accessibilityLabel={[accessibilityLabel, yesLabel].filter(Boolean).join(" ")}
          onPress={() => onChange(true)}
          style={{ width: half, alignItems: "center", justifyContent: "center" }}>
          <Txt variant="meta" weight="600" color={value ? "#fff" : shell.ink}>
            {yesLabel}
          </Txt>
        </Pressable>
        <Pressable
          accessibilityRole="radio"
          accessibilityState={{ selected: !value }}
          accessibilityLabel={[accessibilityLabel, noLabel].filter(Boolean).join(" ")}
          onPress={() => onChange(false)}
          style={{ width: half, alignItems: "center", justifyContent: "center" }}>
          <Txt variant="meta" weight="600" color={!value ? "#fff" : shell.ink}>
            {noLabel}
          </Txt>
        </Pressable>
      </View>
    </View>
  );
}
