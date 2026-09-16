import { useRef, useState } from "react";
import { Modal, Pressable, View, type StyleProp, type ViewStyle } from "react-native";
import { radius, shadow, shell } from "@/theme";
import { Icon } from "./Icon";
import { Txt } from "./Txt";

export type DropdownOption<T extends string | number> = { value: T; label: string };

type Anchor = { x: number; y: number; width: number; height: number };

/** Inline dropdown: the option list opens as a small popover anchored right under the trigger,
 * instead of the app's full-screen dialog (see Select) — for pickers that don't need a title bar. */
export function DropdownMenu<T extends string | number>({
  value,
  options,
  onChange,
  accessibilityLabel,
  disabled,
  style,
  menuWidth,
}: {
  value: T;
  options: DropdownOption<T>[];
  onChange: (value: T) => void;
  accessibilityLabel?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  /** Popover width; defaults to the trigger's own width. */
  menuWidth?: number;
}) {
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const triggerRef = useRef<View>(null);
  const currentLabel = options.find((o) => o.value === value)?.label ?? String(value);
  const open = Boolean(anchor);

  const openMenu = () => {
    triggerRef.current?.measureInWindow((x, y, width, height) => setAnchor({ x, y, width, height }));
  };
  const close = () => setAnchor(null);

  return (
    <View style={style}>
      <Pressable
        ref={triggerRef}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        accessibilityState={{ disabled: Boolean(disabled), expanded: open }}
        disabled={disabled}
        onPress={openMenu}
        style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 10, minHeight: 50, paddingHorizontal: 14, borderWidth: 1, borderColor: shell.inputBorder, borderRadius: radius.sm, backgroundColor: pressed ? shell.surfaceMuted : "#fff", opacity: disabled ? 0.5 : 1 })}>
        <Txt variant="control" style={{ flex: 1 }} numberOfLines={1}>
          {currentLabel}
        </Txt>
        <Icon name={open ? "chevron-up" : "chevron-down"} size={18} color={shell.muted} />
      </Pressable>
      {open && anchor ? (
        <Modal transparent visible animationType="none" onRequestClose={close}>
          <Pressable accessibilityLabel={accessibilityLabel} style={{ flex: 1 }} onPress={close}>
            <View
              style={[
                {
                  position: "absolute",
                  top: anchor.y + anchor.height + 6,
                  left: anchor.x,
                  width: menuWidth ?? Math.max(anchor.width, 150),
                  backgroundColor: "#fff",
                  borderRadius: radius.sm,
                  borderWidth: 1,
                  borderColor: shell.line,
                  paddingVertical: 6,
                },
                shadow,
              ]}>
              {options.map((option) => {
                const active = option.value === value;
                return (
                  <Pressable
                    key={String(option.value)}
                    accessibilityRole="radio"
                    accessibilityState={{ selected: active }}
                    onPress={() => {
                      close();
                      if (!active) onChange(option.value);
                    }}
                    style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44, paddingHorizontal: 14, backgroundColor: active ? shell.greenSoft : pressed ? shell.surfaceMuted : "transparent" })}>
                    <Txt variant="control" weight={active ? "600" : "400"} color={active ? shell.green : shell.ink} numberOfLines={1} style={{ flex: 1 }}>
                      {option.label}
                    </Txt>
                    {active ? <Icon name="check" size={16} color={shell.green} /> : null}
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Modal>
      ) : null}
    </View>
  );
}
