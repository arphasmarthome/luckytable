/* Lightweight range control replacing the prototype's <input type="range" min="30" max="100">.
 * Press or drag on the track, or step with the −/+ buttons. */
import { useRef, useState } from "react";
import { PanResponder, View } from "react-native";
import { Button, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { radius, shell } from "@/theme";

const MIN = 30;
const MAX = 100;
const clamp = (value: number) => Math.min(MAX, Math.max(MIN, Math.round(value)));

export function BrightnessSlider({ value, onChange, accessibilityLabel }: { value: number; onChange: (value: number) => void; accessibilityLabel: string }) {
  const { isPhone } = useBreakpoint();
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const originRef = useRef(0);
  const latest = useRef(onChange);
  latest.current = onChange;
  const fromX = (x: number) => clamp(MIN + (x / Math.max(1, widthRef.current)) * (MAX - MIN));
  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => {
        originRef.current = event.nativeEvent.pageX - event.nativeEvent.locationX;
        latest.current(fromX(event.nativeEvent.locationX));
      },
      onPanResponderMove: (event) => latest.current(fromX(event.nativeEvent.pageX - originRef.current)),
    }),
  ).current;
  const ratio = (clamp(value) - MIN) / (MAX - MIN);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, width: isPhone ? "100%" : undefined }}>
      <Button square size="sm" icon="minus" accessibilityLabel={`${accessibilityLabel} −`} disabled={value <= MIN} onPress={() => onChange(clamp(value - 5))} />
      <View
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min: MIN, max: MAX, now: value, text: `${value}%` }}
        onLayout={(e) => {
          widthRef.current = e.nativeEvent.layout.width;
          setWidth(e.nativeEvent.layout.width);
        }}
        {...responder.panHandlers}
        style={{ flex: isPhone ? 1 : undefined, width: isPhone ? undefined : 240, height: 48, justifyContent: "center" }}>
        <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: "#dfe6e1", overflow: "hidden" }}>
          <View style={{ height: "100%", width: `${Math.round(ratio * 100)}%`, backgroundColor: shell.green }} />
        </View>
        <View style={{ pointerEvents: "none", position: "absolute", left: Math.max(0, ratio * width - 14), width: 28, height: 28, borderRadius: 14, backgroundColor: "#fff", borderWidth: 2, borderColor: shell.green }} />
      </View>
      <Button square size="sm" icon="plus" accessibilityLabel={`${accessibilityLabel} +`} disabled={value >= MAX} onPress={() => onChange(clamp(value + 5))} />
      <Txt variant="control" align="right" style={{ width: 56, fontVariant: ["tabular-nums"] }}>
        {`${value}%`}
      </Txt>
    </View>
  );
}
