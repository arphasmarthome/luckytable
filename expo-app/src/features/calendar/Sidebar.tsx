/* The horizontal family-member filter shown above the calendar grid in every view (year / month /
 * week / day) — a colored avatar pill per member with their event count for the period on screen. */
import { Pressable, ScrollView, View } from "react-native";
import { Icon, Txt } from "@/components/ui";
import { useI18n } from "@/i18n";
import { useDeviceStore } from "@/store/device";
import { tint } from "@/theme";
import { setMember } from "./actions";
import { cal, memberInitial, periodEvents, type CalView } from "./helpers";

type Person = { id: string; name: string; color: string; initial: string };

function usePeople(): Person[] {
  const { t } = useI18n();
  const members = useDeviceStore((s) => s.members);
  return [{ id: "all", name: t("全家"), color: cal.family, initial: "" }, ...members.map((person) => ({ id: person.id, name: person.name, color: person.color, initial: memberInitial(person) }))];
}

function MemberPill({ person, active, count, onPress }: { person: Person; active: boolean; count: number; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={person.name}
      accessibilityState={{ selected: active }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
        minHeight: 44,
        paddingLeft: 4,
        paddingRight: 14,
        borderRadius: 999,
        borderWidth: 1,
        borderColor: active ? person.color : "#e3e9e4",
        backgroundColor: active ? tint(person.color, 0.22) : pressed ? "#f5f7f5" : "#fff",
      })}>
      <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: person.color }}>
        {person.id === "all" ? <Icon name="users" size={17} color="#fff" /> : <Txt variant="meta" weight="700" color="#fff">{person.initial}</Txt>}
      </View>
      <Txt variant="meta" weight={active ? "700" : "600"} color={active ? person.color : "#334a3c"} numberOfLines={1}>
        {person.name}
      </Txt>
      <Txt variant="meta" weight="700" color={active ? person.color : "#8a9790"}>
        {count}
      </Txt>
    </Pressable>
  );
}

export function MemberBar({ view, date }: { view: CalView; date: Date }) {
  const { t } = useI18n();
  const events = useDeviceStore((s) => s.events);
  const current = useDeviceStore((s) => s.calendar.member);
  const people = usePeople();
  const inPeriod = periodEvents(events, view, date, "all");
  const countFor = (id: string) => (id === "all" ? inPeriod.length : inPeriod.filter((event) => event.memberId === id || event.memberId === "family").length);
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel={t("篩選家庭成員")} contentContainerStyle={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
      {people.map((person) => (
        <MemberPill key={person.id} person={person} active={current === person.id} count={countFor(person.id)} onPress={() => setMember(person.id)} />
      ))}
    </ScrollView>
  );
}
