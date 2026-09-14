/* Settings layout primitives (prototype .settings-section-heading / .settings-group / .settings-row). */
import type { ReactNode } from "react";
import { View } from "react-native";
import { Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { shell } from "@/theme";

/** Section title with the "本次操作有效" (or custom) session hint on the right. */
export function SectionHeader({ title, hint }: { title: string; hint?: string }) {
  const { t } = useI18n();
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12, minHeight: 56, paddingBottom: 20, marginBottom: 20, borderBottomWidth: 1, borderBottomColor: shell.line }}>
      <Txt variant="h1">{title}</Txt>
      <Txt variant="meta" muted>
        {hint ?? t("本次操作有效")}
      </Txt>
    </View>
  );
}

export function SettingsGroup({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <View style={{ marginBottom: 28 }}>
      {title ? (
        <Txt variant="h3" muted weight="500" style={{ marginBottom: 8 }}>
          {title}
        </Txt>
      ) : null}
      {children}
    </View>
  );
}

/** Title + detail on the left, a control on the right; stacks on phones. */
export function SettingsRow({ title, detail, control }: { title: string; detail?: string; control?: ReactNode }) {
  const { isPhone } = useBreakpoint();
  return (
    <View style={{ flexDirection: isPhone ? "column" : "row", alignItems: isPhone ? "stretch" : "center", justifyContent: "space-between", gap: isPhone ? 12 : 28, minHeight: isPhone ? 0 : 94, paddingVertical: 18, borderBottomWidth: 1, borderBottomColor: shell.line }}>
      <View style={{ flex: isPhone ? undefined : 1, minWidth: 0 }}>
        <Txt variant="h3" weight="500">
          {title}
        </Txt>
        {detail ? (
          <Txt variant="body" muted style={{ marginTop: 6 }}>
            {detail}
          </Txt>
        ) : null}
      </View>
      {control ? <View style={{ flexShrink: 0, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", flexWrap: "wrap", gap: 10, maxWidth: "100%" }}>{control}</View> : null}
    </View>
  );
}
