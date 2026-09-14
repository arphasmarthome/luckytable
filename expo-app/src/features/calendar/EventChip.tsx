/* renderEvent: the member-coloured event button used by the month and week grids. */
import { Pressable, View } from "react-native";
import { Icon, Txt } from "@/components/ui";
import { useI18n } from "@/i18n";
import { memberById, useDeviceStore } from "@/store/device";
import { tint } from "@/theme";
import { openEventDetail } from "./dialogs";
import type { CalEvent } from "./helpers";

export function EventChip({ event, compact }: { event: CalEvent; compact?: boolean }) {
  const { t } = useI18n();
  const members = useDeviceStore((s) => s.members);
  const owner = memberById(event.memberId, members);
  const time = event.time || t("全天");
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${time} ${t(event.title)}`}
      onPress={() => openEventDetail(event.id)}
      style={({ pressed }) => ({
        flexDirection: compact ? "row" : "column",
        alignItems: compact ? "center" : "flex-start",
        gap: compact ? 6 : 6,
        minHeight: compact ? 32 : 44,
        paddingVertical: compact ? 4 : 10,
        paddingHorizontal: compact ? 6 : 10,
        borderLeftWidth: 3,
        borderLeftColor: owner.color,
        borderRadius: compact ? 3 : 5,
        backgroundColor: tint(owner.color, pressed ? 0.18 : 0.07),
        opacity: event.done ? 0.65 : 1,
      })}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 0 }}>
        <Txt variant={compact ? "caption" : "meta"} color="#697a74">
          {time}
        </Txt>
        {event.done ? <Icon name="check" size={compact ? 12 : 16} color="#697a74" /> : null}
      </View>
      <Txt variant={compact ? "meta" : "card"} weight="500" color={event.done ? "#7c847f" : "#34443b"} numberOfLines={compact ? 1 : 3} style={[{ flexShrink: 1, minWidth: 0 }, event.done ? { textDecorationLine: "line-through" } : null]}>
        {t(event.title)}
      </Txt>
      {compact ? null : (
        <Txt variant="meta" color="#738079" numberOfLines={2}>
          {owner.name}
          {event.location ? ` · ${t(event.location)}` : ""}
        </Txt>
      )}
    </Pressable>
  );
}
