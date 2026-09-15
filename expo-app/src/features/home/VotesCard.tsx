/* Home → 大家的投票 (prototype votesMarkup). */
import { View } from "react-native";
import { EmptyNote, Txt } from "@/components/ui";
import { useMakeSummary } from "@/features/make/summary";
import { useI18n } from "@/i18n";
import { radius, shell } from "@/theme";
import { HomeCard } from "./HomeCard";

const VOTE_GREEN = "#3ee36f";

export function VotesCard() {
  const { t } = useI18n();
  const { votes } = useMakeSummary();
  const top = Math.max(1, ...votes.map((v) => v.n));
  return (
    <HomeCard title={t("大家的投票")} style={{ flex: 1 }}>
      {votes.length ? (
        <View style={{ gap: 10 }}>
          {votes.map((v) => (
            <View key={v.id} style={{ gap: 4 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", gap: 8 }}>
                <Txt variant="meta" weight="600" style={{ flex: 1, minWidth: 0 }} numberOfLines={1}>
                  {v.label}
                </Txt>
                <Txt variant="caption" muted numberOfLines={1}>
                  {t("{n} 票", { n: v.n })}
                </Txt>
              </View>
              <View style={{ height: 8, borderRadius: radius.pill, backgroundColor: "#e7ebe8", overflow: "hidden" }}>
                <View style={{ height: "100%", width: `${Math.round((v.n / top) * 100)}%`, borderRadius: radius.pill, backgroundColor: VOTE_GREEN }} />
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
