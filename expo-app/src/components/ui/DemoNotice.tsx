import { View } from "react-native";
import { radius, shell } from "@/theme";
import { Txt } from "./Txt";

/** The prototype's "demo only" callout used inside dialogs. */
export function DemoNotice({ children }: { children: string }) {
  return (
    <View style={{ backgroundColor: shell.surfaceMuted, borderRadius: radius.sm, paddingHorizontal: 16, paddingVertical: 14 }}>
      <Txt variant="meta" muted>
        {children}
      </Txt>
    </View>
  );
}
