import { Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { dialog } from "@/store/dialog";
import { radius, shell } from "@/theme";
import { Icon } from "./Icon";
import { Txt } from "./Txt";

export type SelectOption<T extends string | number> = { value: T; label: string };

/** Drop-down replacement: shows the current label and opens the app dialog with the option list. */
export function Select<T extends string | number>({ value, options, onChange, label, disabled, style, accessibilityLabel, title }: { value: T; options: SelectOption<T>[]; onChange: (value: T) => void; label?: string; disabled?: boolean; style?: StyleProp<ViewStyle>; accessibilityLabel?: string; title?: string }) {
  const currentLabel = options.find((o) => o.value === value)?.label ?? String(value);
  const open = () =>
    dialog.show({
      title: title || label || accessibilityLabel || "",
      body: (
        <View style={{ gap: 4 }}>
          {options.map((option) => {
            const active = option.value === value;
            return (
              <Pressable
                key={String(option.value)}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => {
                  dialog.close();
                  if (!active) onChange(option.value);
                }}
                style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 52, paddingHorizontal: 12, borderRadius: radius.sm, backgroundColor: active ? shell.greenSoft : pressed ? shell.surfaceMuted : "transparent" })}>
                <Icon name={active ? "circle-check" : "circle"} size={20} color={active ? shell.green : shell.muted} />
                <Txt variant="control" weight={active ? "600" : "400"} color={active ? shell.green : shell.ink} style={{ flex: 1 }}>
                  {option.label}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      ),
    });
  return (
    <View style={[{ gap: 8 }, style]}>
      {label ? (
        <Txt variant="control" weight="500">
          {label}
        </Txt>
      ) : null}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
        accessibilityState={{ disabled: Boolean(disabled) }}
        disabled={disabled}
        onPress={open}
        style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 10, minHeight: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: shell.inputBorder, borderRadius: radius.sm, backgroundColor: pressed ? shell.surfaceMuted : "#fff", opacity: disabled ? 0.5 : 1 })}>
        <Txt variant="control" style={{ flex: 1 }} numberOfLines={1}>
          {currentLabel}
        </Txt>
        <Icon name="chevron-down" size={18} color={shell.muted} />
      </Pressable>
    </View>
  );
}
