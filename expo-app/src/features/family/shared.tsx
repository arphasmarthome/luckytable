/* Pieces shared by the 積分 (family points) and 健康 (health) modules — port of the
 * prototype's memberTabs / fh-tabs / fh-page-heading / empty-state / form helpers
 * (prototype/device/family-health.js + family-health.css). */
import type { ReactNode } from "react";
import { Pressable, ScrollView, View, type StyleProp, type ViewStyle } from "react-native";
import { Avatar, Button, Chip, Icon, TextField, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { dateKey, today } from "@/lib/date";
import { useDeviceStore } from "@/store/device";
import { radius, shell } from "@/theme";

/** Colour tokens from family-health.css (.fh-page) */
export const fh = { green: "#246b58", orange: "#c48438", line: "#e1e6e3", muted: "#758078", ink: "#26312b", soft: "#eaf3ee", softBorder: "#538b71", error: "#b94e43" };

/** Member chip row (memberTabs): avatar, name, optional point balance, check mark on the selected one. */
export function MemberChips({ selected, onSelect, withPoints }: { selected: string; onSelect: (id: string) => void; withPoints?: boolean }) {
  const { t, number } = useI18n();
  const members = useDeviceStore((s) => s.members);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel={t("選擇家庭成員")} style={{ flexGrow: 0 }} contentContainerStyle={{ gap: 12, paddingVertical: 2 }}>
      {members.map((item) => {
        const active = item.id === selected;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            onPress={() => onSelect(item.id)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              gap: 12,
              minHeight: 64,
              minWidth: 170,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: radius.sm,
              borderWidth: 1,
              borderColor: active ? fh.softBorder : "#dce4de",
              backgroundColor: active ? fh.soft : pressed ? shell.surfaceMuted : "#fff",
            })}>
            <Avatar color={item.color} initials={item.initial || item.name.slice(0, 1)} size={40} />
            <View style={{ flexShrink: 1 }}>
              <Txt variant="card" weight="600">
                {item.name}
              </Txt>
              {withPoints ? (
                <Txt variant="meta" color="#7b867f">
                  {t("{n} 點", { n: number(item.points) })}
                </Txt>
              ) : null}
            </View>
            {active ? <Icon name="circle-check" size={20} color={fh.green} /> : null}
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export type TabDef<T extends string> = { id: T; label: string; icon: string };

/** Underlined tab strip (.fh-tabs); scrolls horizontally on narrow screens. */
export function FhTabs<T extends string>({ tabs, value, onChange, accessibilityLabel, style }: { tabs: TabDef<T>[]; value: T; onChange: (id: T) => void; accessibilityLabel?: string; style?: StyleProp<ViewStyle> }) {
  const { t } = useI18n();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel={accessibilityLabel} style={[{ flexGrow: 0, borderBottomWidth: 1, borderBottomColor: fh.line }, style]} contentContainerStyle={{ gap: 4 }}>
      {tabs.map((tab) => {
        const active = tab.id === value;
        const color = active ? fh.green : "#748078";
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            onPress={() => onChange(tab.id)}
            style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 8, minHeight: 52, paddingHorizontal: 16, borderBottomWidth: 3, borderBottomColor: active ? fh.green : "transparent", backgroundColor: pressed ? "#f0f5f1" : "transparent" })}>
            <Icon name={tab.icon} size={18} color={color} />
            <Txt variant="control" weight={active ? "700" : "500"} color={color}>
              {t(tab.label)}
            </Txt>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

/** Page title with a wrapping action row (.fh-page-heading). */
export function PageHeading({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
      <Txt variant="h1">{title}</Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 10 }}>{children}</View>
    </View>
  );
}

/** White content board (.fh-family-board / .fh-health-layout). */
export function Board({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { isPhone } = useBreakpoint();
  return <View style={[{ backgroundColor: "#fff", borderRadius: radius.md, borderWidth: 1, borderColor: fh.line, padding: isPhone ? 16 : 24, gap: 20 }, style]}>{children}</View>;
}

/** Centered empty state (.empty-state): icon, heading, optional note and primary action. */
export function EmptyState({ icon, title, note, action }: { icon: string; title: string; note?: string; action?: { label: string; icon?: string; onPress: () => void } }) {
  return (
    <View style={{ alignItems: "center", gap: 14, paddingVertical: 40, paddingHorizontal: 16 }}>
      <Icon name={icon} size={40} color="#9fb0a5" />
      <Txt variant="h3" align="center">
        {title}
      </Txt>
      {note ? (
        <Txt muted align="center">
          {note}
        </Txt>
      ) : null}
      {action ? <Button variant="primary" label={action.label} icon={action.icon ?? "plus"} onPress={action.onPress} /> : null}
    </View>
  );
}

/** Form footer (formFooter): live error line, 取消 + submit. Rendered inside the dialog body so it can read the form state. */
export function FormActions({ error, onCancel, onSubmit, submitLabel, submitIcon = "check" }: { error?: string; onCancel: () => void; onSubmit: () => void; submitLabel?: string; submitIcon?: string }) {
  const { t } = useI18n();
  return (
    <View style={{ gap: 12, marginTop: 8 }}>
      <Txt variant="meta" color={fh.error} accessibilityLiveRegion="polite" accessibilityRole="alert" style={{ minHeight: 20 }}>
        {error || ""}
      </Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 12 }}>
        <Button variant="text" label={t("取消")} onPress={onCancel} />
        <Button variant="primary" icon={submitIcon} label={submitLabel ?? t("儲存")} onPress={onSubmit} />
      </View>
    </View>
  );
}

export type Choice<T extends string> = { value: T; label: string };

/** Inline replacement for a <select> inside a dialog (the kit's Select opens the app dialog and would replace the form). */
export function ChoiceField<T extends string>({ label, value, options, onChange, disabled, note }: { label: string; value: T; options: Choice<T>[]; onChange: (value: T) => void; disabled?: boolean; note?: string }) {
  return (
    <View style={{ gap: 8 }} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <Txt variant="control" weight="500">
        {label}
      </Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {options.map((option) => {
          const active = option.value === value;
          return <Chip key={option.value} label={option.label} active={active} onPress={() => (disabled ? undefined : onChange(option.value))} accessibilityLabel={option.label} style={{ minHeight: 44, opacity: disabled && !active ? 0.45 : 1 }} />;
        })}
      </View>
      {note ? (
        <Txt variant="meta" muted>
          {note}
        </Txt>
      ) : null}
    </View>
  );
}

/** Member picker used by the task / reward / wearable forms (memberOptions). */
export function MemberChoice({ label, value, onChange, disabled }: { label: string; value: string; onChange: (id: string) => void; disabled?: boolean }) {
  const members = useDeviceStore((s) => s.members);
  return <ChoiceField label={label} value={value} options={members.map((m) => ({ value: m.id, label: m.name }))} onChange={onChange} disabled={disabled} />;
}

/** Numeric text input; parsing and range checks happen in the submit handler. */
export function NumberField({ label, value, onChange, placeholder, integer }: { label: string; value: string; onChange: (value: string) => void; placeholder?: string; integer?: boolean }) {
  return <TextField label={label} value={value} onChangeText={onChange} placeholder={placeholder} keyboardType={integer ? "number-pad" : "decimal-pad"} inputMode={integer ? "numeric" : "decimal"} />;
}

/** Two-column form grid on wide screens, single column on phones (.form-grid). */
export function FormGrid({ children }: { children: ReactNode }) {
  const { isPhone } = useBreakpoint();
  return <View style={{ flexDirection: isPhone ? "column" : "row", flexWrap: "wrap", gap: 16 }}>{children}</View>;
}
export function FormCell({ children, full }: { children: ReactNode; full?: boolean }) {
  const { isPhone } = useBreakpoint();
  return <View style={{ flexBasis: isPhone || full ? "100%" : "46%", flexGrow: 1, minWidth: 0 }}>{children}</View>;
}

export type WeekDay = { date: Date; key: string; label: string; longLabel: string };

/** Monday-first week around today (week()). */
export function useWeek(): WeekDay[] {
  const { weekday, isZh } = useI18n();
  const start = new Date(today);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    return { date, key: dateKey(date), label: weekday(date.getDay(), isZh ? "long" : "short"), longLabel: weekday(date.getDay(), "long") };
  });
}

/** Small "lock" caption (.fh-local-label). */
export function LocalLabel({ children }: { children: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      <Icon name="lock-keyhole" size={16} color="#889487" />
      <Txt variant="meta" color="#889487">
        {children}
      </Txt>
    </View>
  );
}
