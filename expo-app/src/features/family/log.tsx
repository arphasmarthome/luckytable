/* 積分帳本 tab (renderLog): the member's points ledger. */
import { View } from "react-native";
import { Icon, Txt } from "@/components/ui";
import { useI18n } from "@/i18n";
import { useDeviceStore, type Member } from "@/store/device";
import { radius } from "@/theme";
import { EmptyState, fh } from "./shared";

export function LogView({ person }: { person: Member }) {
  const { t, number, tag } = useI18n();
  const rows = useDeviceStore((s) => s.pointsLog).filter((item) => item.memberId === person.id);
  return (
    <View style={{ gap: 16 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <Txt variant="h2" style={{ flexGrow: 1 }}>
          {t("積分記錄")}
        </Txt>
        <View style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.pill, backgroundColor: fh.soft }}>
          <Txt variant="meta" weight="600" color={fh.green}>
            {t("餘額 {n}", { n: number(person.points) })}
          </Txt>
        </View>
      </View>
      {rows.length ? (
        rows.map((row) => {
          const negative = row.amount < 0;
          const when = row.at ? new Date(row.at).toLocaleString(tag, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : row.date;
          return (
            <View key={row.id} style={{ flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: fh.line }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: negative ? "#fcf3e7" : "#edf6ef" }}>
                <Icon name={negative ? "minus" : "plus"} size={20} color={negative ? "#b38056" : "#438262"} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt variant="card" weight="500">
                  {row.title}
                </Txt>
                <Txt variant="meta" muted>
                  {when}
                </Txt>
              </View>
              <Txt variant="h2" weight="600" color={negative ? "#b58556" : "#508164"}>
                {row.amount > 0 ? "+" : ""}
                {String(row.amount)}
              </Txt>
            </View>
          );
        })
      ) : (
        <EmptyState icon="list" title={t("暫無新的積分記錄")} note={t("目前餘額 {n} 積分", { n: number(person.points) })} />
      )}
    </View>
  );
}
