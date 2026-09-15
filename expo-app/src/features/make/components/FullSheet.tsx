/* Near-full-screen modal sheet (recipe book, cooking summary) with a close button top-right. */
import type { ReactNode } from "react";
import { Modal, Pressable, ScrollView, View } from "react-native";
import { Icon } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { make, radius } from "@/theme";
import { MTxt } from "./ui";

export function FullSheet({ visible, title, onClose, closeLabel, footer, children }: { visible: boolean; title: string; onClose: () => void; closeLabel: string; footer?: ReactNode; children: ReactNode }) {
  const { isPhone } = useBreakpoint();
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} statusBarTranslucent supportedOrientations={["portrait", "landscape"]}>
      <View style={{ flex: 1, backgroundColor: "rgba(17,25,22,0.62)", padding: isPhone ? 0 : 28 }}>
        <View style={{ flex: 1, borderRadius: isPhone ? 0 : radius.xl, overflow: "hidden", backgroundColor: make.background, borderWidth: isPhone ? 0 : 1, borderColor: make.border }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12, paddingLeft: isPhone ? 16 : 24, paddingRight: 12, minHeight: 60, borderBottomWidth: 1, borderBottomColor: make.border, backgroundColor: make.surface }}>
            <MTxt variant="section" weight="700" numberOfLines={1} style={{ flex: 1 }}>
              {title}
            </MTxt>
            <Pressable accessibilityRole="button" accessibilityLabel={closeLabel} onPress={onClose} hitSlop={6} style={({ pressed }) => ({ width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? make.surfacePressed : make.surface2 })}>
              <Icon name="x" size={20} color={make.foreground} />
            </Pressable>
          </View>
          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: isPhone ? 16 : 24, gap: 16 }} showsVerticalScrollIndicator>
            {children}
          </ScrollView>
          {footer ? <View style={{ padding: isPhone ? 12 : 16, borderTopWidth: 1, borderTopColor: make.border, backgroundColor: make.surface }}>{footer}</View> : null}
        </View>
      </View>
    </Modal>
  );
}
