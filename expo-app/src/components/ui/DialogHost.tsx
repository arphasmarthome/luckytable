import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useDialogStore } from "@/store/dialog";
import { t } from "@/i18n";
import { radius, shadow, shell } from "@/theme";
import { Button } from "./Button";
import { Txt } from "./Txt";

function Render({ node }: { node: ReactNode | (() => ReactNode) }) {
  if (typeof node === "function") {
    const Body = node as () => ReactNode;
    return <>{Body()}</>;
  }
  return <>{node}</>;
}

export function DialogHost() {
  const current = useDialogStore((s) => s.current);
  const close = useDialogStore((s) => s.close);
  const { width, height, isPhone } = useBreakpoint();
  const open = Boolean(current);
  const maxWidth = Math.min(current?.wide ? 1100 : 760, width - (isPhone ? 16 : 48));
  return (
    <Modal visible={open} transparent animationType="fade" onRequestClose={close} statusBarTranslucent>
      <Pressable accessibilityLabel={t("關閉")} onPress={close} style={{ flex: 1, backgroundColor: "#20342966", alignItems: "center", justifyContent: "center", padding: isPhone ? 8 : 24 }}>
        {current ? (
          <Pressable onPress={() => undefined} style={[{ width: maxWidth, maxHeight: Math.min(960, height - 48), backgroundColor: "#fff", borderRadius: radius.md, overflow: "hidden" }, shadow]}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: isPhone ? 18 : 28, paddingVertical: isPhone ? 16 : 22, borderBottomWidth: 1, borderBottomColor: shell.line }}>
              <Txt variant="h2" style={{ flex: 1 }}>
                {current.title}
              </Txt>
              <Button square icon="x" accessibilityLabel={t("關閉")} onPress={close} />
            </View>
            <ScrollView style={{ flexShrink: 1 }} contentContainerStyle={{ padding: isPhone ? 18 : 28, gap: 12 }} keyboardShouldPersistTaps="handled">
              <Render node={current.body} />
            </ScrollView>
            {current.footer ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "flex-end", gap: 12, paddingHorizontal: isPhone ? 18 : 28, paddingVertical: 18, borderTopWidth: 1, borderTopColor: shell.line }}>
                <Render node={current.footer} />
              </View>
            ) : null}
          </Pressable>
        ) : null}
      </Pressable>
    </Modal>
  );
}
