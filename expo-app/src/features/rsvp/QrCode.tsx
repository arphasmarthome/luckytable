/* QR code drawn as a grid of Views — no SVG or canvas needed, works on web and native. */
import { create } from "qrcode";
import { useMemo } from "react";
import { View } from "react-native";

export function QrCode({ value, size = 180, accessibilityLabel }: { value: string; size?: number; accessibilityLabel?: string }) {
  const rows = useMemo(() => {
    const qr = create(value, { errorCorrectionLevel: "M" });
    const n = qr.modules.size;
    const data = qr.modules.data;
    return Array.from({ length: n }, (_, y) => Array.from({ length: n }, (__, x) => Boolean(data[y * n + x])));
  }, [value]);
  const n = rows.length;
  const cell = size / n;
  return (
    <View accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={{ width: size, height: size, padding: 0, backgroundColor: "#fff" }}>
      {rows.map((row, y) => (
        <View key={y} style={{ flexDirection: "row", height: cell }}>
          {row.map((dark, x) => (
            <View key={x} style={{ width: cell, height: cell, backgroundColor: dark ? "#1a2320" : "#fff" }} />
          ))}
        </View>
      ))}
    </View>
  );
}
