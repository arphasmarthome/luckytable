import { View } from "react-native";
import { useToastStore } from "@/store/toast";
import { radius, shadow, shell } from "@/theme";
import { Txt } from "./Txt";

export function ToastHost() {
  const visible = useToastStore((s) => s.visible);
  const message = useToastStore((s) => s.message);
  if (!visible) return null;
  return (
    <View style={{ position: "absolute", top: 20, left: 0, right: 0, alignItems: "center", zIndex: 200, pointerEvents: "none" }}>
      <View accessibilityLiveRegion="polite" style={[{ maxWidth: "88%", backgroundColor: shell.ink, paddingHorizontal: 18, paddingVertical: 12, borderRadius: radius.sm }, shadow]}>
        <Txt variant="meta" color="#fff">
          {message}
        </Txt>
      </View>
    </View>
  );
}
