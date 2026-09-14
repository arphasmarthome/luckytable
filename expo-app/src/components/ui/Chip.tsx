import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { radius, shell, tint } from "@/theme";
import { Icon } from "./Icon";
import { Txt } from "./Txt";

export type ChipProps = {
  label: string;
  active?: boolean;
  onPress?: () => void;
  onRemove?: () => void;
  icon?: string;
  /** trailing bold text such as a count */
  count?: string | number;
  accent?: string;
  soft?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
};

export function Chip({ label, active, onPress, onRemove, icon, count, accent = shell.green, soft, style, accessibilityLabel }: ChipProps) {
  const bg = active ? accent : soft ? shell.surfaceMuted : "#fff";
  const fg = active ? "#fff" : shell.ink;
  const border = active ? accent : soft ? shell.surfaceMuted : shell.line;
  const Wrapper = onPress ? Pressable : View;
  return (
    <Wrapper
      accessibilityRole={onPress ? "button" : undefined}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={onPress ? { selected: Boolean(active) } : undefined}
      onPress={onPress}
      style={({ pressed }: { pressed?: boolean }) => [
        { flexDirection: "row", alignItems: "center", gap: 8, minHeight: 40, paddingHorizontal: 14, borderRadius: radius.pill, borderWidth: 1, backgroundColor: bg, borderColor: border, opacity: pressed ? 0.8 : 1 },
        style,
      ]}>
      {icon ? <Icon name={icon} size={16} color={fg} /> : null}
      <Txt variant="meta" color={fg} weight={active ? "600" : "500"}>
        {label}
      </Txt>
      {count !== undefined ? (
        <Txt variant="meta" color={active ? "#fff" : accent} weight="700">
          {String(count)}
        </Txt>
      ) : null}
      {onRemove ? (
        <Pressable onPress={onRemove} accessibilityRole="button" accessibilityLabel="×" hitSlop={8} style={{ marginLeft: 2, width: 24, height: 24, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: tint(shell.ink, 0.08) }}>
          <Icon name="x" size={14} color={shell.ink} />
        </Pressable>
      ) : null}
    </Wrapper>
  );
}
