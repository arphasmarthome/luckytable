import { View } from "react-native";
import { tint } from "@/theme";
import { Txt } from "./Txt";

export function Avatar({ color, initials, size = 44 }: { color: string; initials: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: tint(color, 0.13), alignItems: "center", justifyContent: "center" }}>
      <Txt variant={size >= 44 ? "body" : "meta"} weight="700" color={color} style={{ fontSize: Math.round(size * 0.45), lineHeight: Math.round(size * 0.6) }}>
        {initials}
      </Txt>
    </View>
  );
}
