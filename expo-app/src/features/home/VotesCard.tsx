/* Home → 大家的投票 (prototype votesMarkup). */
import { View } from "react-native";
import { EmptyNote, Txt } from "@/components/ui";
import { useMakeSummary } from "@/features/make/summary";
import { useI18n } from "@/i18n";
import { radius, shell } from "@/theme";
import { HomeCard } from "./HomeCard";

export function VotesCard() {
  const { t } = useI18n();
  const { votes } = useMakeSummary();
  const top = Math.max(1, ...votes.map((v) => v.n));
  return (
    <HomeCard title={t("大家的投票")} style={{ flex: 1 }}>
      {votes.length ? (
        <View style={{ gap: 16 }}>
          {votes.map((v, i) => (
            <View key={v.id} style={{ gap: 8 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
                <Txt variant="card" weight="600" style={{ flexShrink: 1 }}>
                  {v.label}
                </Txt>
                <Txt variant="meta" muted>
                  {t("{n} 票", { n: v.n })}
                </Txt>
              </View>
              <View style={{ height: 12, borderRadius: radius.pill, backgroundColor: "#e7ebe8", overflow: "hidden" }}>
                <View style={{ height: "100%", width: `${Math.round((v.n / top) * 100)}%`, borderRadius: radius.pill, backgroundColor: i === 0 ? shell.coral : "#8fb4a2" }} />
              </View>
            </View>
          ))}
        </View>
      ) : (
        <EmptyNote>{t("尚無投票")}</EmptyNote>
      )}
      <Txt variant="meta" muted style={{ marginTop: "auto" }}>
        {t("在任一道菜的頁面都可以投票。")}
      </Txt>
    </HomeCard>
  );
}
