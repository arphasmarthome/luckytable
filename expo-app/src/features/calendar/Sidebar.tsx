/* renderMembers (vertical list / horizontal chip row), renderUpcoming and the weather footer. */
import { Pressable, ScrollView, View } from "react-native";
import { Chip, Icon, Txt } from "@/components/ui";
import { useI18n } from "@/i18n";
import { dateKey } from "@/lib/date";
import { memberById, useDeviceStore } from "@/store/device";
import { tint } from "@/theme";
import { setMember } from "./actions";
import { openEventDetail } from "./dialogs";
import { cal, filterEvents, memberInitial, periodEvents, shortDate, type CalEvent, type CalView } from "./helpers";

type Person = { id: string; name: string; color: string; initial: string };

function usePeople(): Person[] {
  const { t } = useI18n();
  const members = useDeviceStore((s) => s.members);
  return [{ id: "all", name: t("全家"), color: cal.family, initial: "" }, ...members.map((person) => ({ id: person.id, name: person.name, color: person.color, initial: memberInitial(person) }))];
}

/** Member filter. `horizontal` is the phone chip row ("顯示："); otherwise the sidebar list with counts. */
export function MemberBar({ view, date, horizontal }: { view: CalView; date: Date; horizontal?: boolean }) {
  const { t } = useI18n();
  const events = useDeviceStore((s) => s.events);
  const current = useDeviceStore((s) => s.calendar.member);
  const people = usePeople();
  const inPeriod = periodEvents(events, view, date, "all");
  const countFor = (id: string) => (id === "all" ? inPeriod.length : inPeriod.filter((event) => event.memberId === id || event.memberId === "family").length);
  if (horizontal) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} accessibilityLabel={t("篩選家庭成員")} contentContainerStyle={{ flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 }}>
        <Txt variant="control" weight="600" color="#75857a" style={{ marginRight: 4 }}>
          {t("顯示：")}
        </Txt>
        {people.map((person) => (
          <Chip key={person.id} label={person.name} icon={person.id === "all" ? "users" : undefined} active={current === person.id} accent={person.color} onPress={() => setMember(person.id)} style={{ minHeight: 44 }} />
        ))}
      </ScrollView>
    );
  }
  return (
    <View accessibilityLabel={t("篩選家庭成員")} style={{ gap: 6 }}>
      <Txt variant="control" weight="600" color="#75857a" style={{ paddingHorizontal: 10, paddingBottom: 2 }}>
        {t("家庭成員")}
      </Txt>
      {people.map((person) => {
        const active = current === person.id;
        return (
          <Pressable
            key={person.id}
            accessibilityRole="button"
            accessibilityLabel={person.name}
            accessibilityState={{ selected: active }}
            onPress={() => setMember(person.id)}
            style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 10, minHeight: 46, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 7, borderWidth: 1, borderColor: active ? cal.activePersonBorder : "transparent", backgroundColor: active ? cal.activePerson : pressed ? "#eff4ef" : "transparent" })}>
            <View style={{ width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center", backgroundColor: active ? "#fff" : tint(person.color, 0.1) }}>
              {person.id === "all" ? <Icon name="users" size={22} color={active ? cal.green : person.color} /> : <Txt variant="card" weight="600" color={active ? cal.green : person.color}>{person.initial}</Txt>}
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt variant="card" weight={active ? "600" : "500"} color={active ? cal.green : "#334a3c"} numberOfLines={1}>
                {person.name}
              </Txt>
              <Txt variant="meta" color={active ? "#688574" : "#899489"}>
                {t("{n} 個行程", { n: countFor(person.id) })}
              </Txt>
            </View>
            {active ? <Icon name="check" size={22} color={cal.green} /> : null}
          </Pressable>
        );
      })}
    </View>
  );
}

/** The next three events on or after the shown date (respects the member filter). */
export function Upcoming({ date, events }: { date: Date; events: CalEvent[] }) {
  const { t } = useI18n();
  const members = useDeviceStore((s) => s.members);
  const from = dateKey(date);
  const upcoming = filterEvents(events, "all").filter((event) => event.date >= from).slice(0, 3);
  return (
    <View style={{ paddingTop: 6, paddingHorizontal: 4 }}>
      <Txt variant="h3" color="#728477" style={{ marginBottom: 4 }}>
        {t("接下來")}
      </Txt>
      {upcoming.length ? (
        upcoming.map((event) => (
          <Pressable key={event.id} accessibilityRole="button" accessibilityLabel={t(event.title)} onPress={() => openEventDetail(event.id)} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10, minHeight: 44, paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: "#e7ece6" }}>
            <Txt variant="meta" weight="600" color="#74917d" style={{ width: 52, paddingTop: 3 }}>
              {event.time || t("全天")}
            </Txt>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt variant="body" numberOfLines={1}>{t(event.title)}</Txt>
              <Txt variant="meta" color="#86938b" style={{ marginTop: 2 }}>
                {shortDate(event.date)} · {memberById(event.memberId, members).name}
              </Txt>
            </View>
          </Pressable>
        ))
      ) : (
        <Txt variant="body" color="#96a39d" style={{ paddingVertical: 20 }}>
          {t("暫無近期安排")}
        </Txt>
      )}
    </View>
  );
}

export function Weather() {
  const { t } = useI18n();
  const city = useDeviceStore((s) => s.settings.city);
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, borderTopWidth: 1, borderTopColor: cal.line, paddingTop: 10, paddingHorizontal: 4, marginTop: "auto" }}>
      <Icon name="cloud-sun" size={26} color={cal.weather} />
      <View style={{ flex: 1, flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
        <Txt variant="h3" color="#738678">
          24°
        </Txt>
        <Txt variant="meta" color="#75867b" numberOfLines={2} style={{ flexShrink: 1 }}>
          {t(city || "台北")} · {t("局部多雲")}
        </Txt>
      </View>
    </View>
  );
}
