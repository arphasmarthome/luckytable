/* Generic range control (replaces the prototype's <input type="range">). Press or drag on the
 * track, or step with the −/+ buttons. Used for screen brightness and the photo-frame slideshow
 * duration. */
import { useRef, useState } from "react";
import { PanResponder, View } from "react-native";
import { Button, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { radius, shell } from "@/theme";

export function RangeSlider({
  value,
  onChange,
  min,
  max,
  step = 1,
  accessibilityLabel,
  format = (v: number) => `${v}%`,
  trackWidth = 240,
}: {
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  accessibilityLabel: string;
  format?: (value: number) => string;
  trackWidth?: number;
}) {
  const { isPhone } = useBreakpoint();
  const clamp = (v: number) => Math.min(max, Math.max(min, Math.round(v / step) * step));
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const originRef = useRef(0);
  const latest = useRef(onChange);
  latest.current = onChange;
  const fromX = (x: number) => clamp(min + (x / Math.max(1, widthRef.current)) * (max - min));
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
  const ratio = (clamp(value) - min) / (max - min);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 10, width: isPhone ? "100%" : undefined }}>
      <Button square size="sm" icon="minus" accessibilityLabel={`${accessibilityLabel} −`} disabled={value <= min} onPress={() => onChange(clamp(value - step))} />
      <View
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min, max, now: value, text: format(value) }}
        onLayout={(e) => {
          widthRef.current = e.nativeEvent.layout.width;
          setWidth(e.nativeEvent.layout.width);
        }}
        {...responder.panHandlers}
        style={{ flex: isPhone ? 1 : undefined, width: isPhone ? undefined : trackWidth, height: 48, justifyContent: "center" }}>
        <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: "#dfe6e1", overflow: "hidden" }}>
          <View style={{ height: "100%", width: `${Math.round(ratio * 100)}%`, backgroundColor: shell.green }} />
        </View>
        <View style={{ pointerEvents: "none", position: "absolute", left: Math.max(0, ratio * width - 14), width: 28, height: 28, borderRadius: 14, backgroundColor: "#fff", borderWidth: 2, borderColor: shell.green }} />
      </View>
      <Button square size="sm" icon="plus" accessibilityLabel={`${accessibilityLabel} +`} disabled={value >= max} onPress={() => onChange(clamp(value + step))} />
      <Txt variant="control" align="right" style={{ width: 56, fontVariant: ["tabular-nums"] }}>
        {format(value)}
      </Txt>
    </View>
  );
}
