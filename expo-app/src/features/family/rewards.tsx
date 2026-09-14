/* 獎勵目標 tab (renderRewards): reward cards with progress towards the cost, redeem and remove. */
import { View } from "react-native";
import { Button, Icon, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { useDeviceStore, type Member } from "@/store/device";
import { radius } from "@/theme";
import { askRedeem, confirmDeleteReward, openRewardForm } from "./dialogs";
import { EmptyState, fh } from "./shared";

export function RewardsView({ person }: { person: Member }) {
  const { t, number } = useI18n();
  const { isWide } = useBreakpoint();
  const rewards = useDeviceStore((s) => s.rewards).filter((reward) => reward.memberId === person.id);
  return (
    <View style={{ gap: 20 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
        <View style={{ flexGrow: 1, minWidth: 160 }}>
          <Txt variant="h2">{t("期待的小獎勵")}</Txt>
          <Txt variant="meta" muted>
            {t("可用 {n} 積分", { n: number(person.points) })}
          </Txt>
        </View>
        <Button variant="text" icon="plus" label={t("新增獎勵")} onPress={openRewardForm} />
      </View>
      {rewards.length ? (
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
          {rewards.map((reward) => {
            const ready = !reward.redeemed && person.points >= reward.cost;
            const progress = reward.redeemed ? 100 : Math.min(100, (person.points / reward.cost) * 100);
            const status = reward.redeemed ? t("獎勵已兌換") : person.points >= reward.cost ? t("已達成，隨時兌換") : t("還差 {n} 積分", { n: number(reward.cost - person.points) });
            return (
              <View key={reward.id} style={{ flexBasis: isWide ? "47%" : "100%", flexGrow: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 14, padding: 18, borderWidth: 1, borderColor: fh.line, borderRadius: radius.md, backgroundColor: reward.redeemed ? "#f7f9f6" : "#fff" }}>
                <View style={{ width: 52, height: 52, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", backgroundColor: "#fff6e2" }}>
                  <Icon name={reward.redeemed ? "check" : "gift"} size={26} color="#b48a3c" />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt variant="h3">{t(reward.title)}</Txt>
                  <Txt variant="meta" muted>
                    {t("{n} 積分", { n: number(reward.cost) })}
                  </Txt>
                  <View accessibilityLabel={t("獎勵進度 {n}%", { n: Math.min(100, Math.floor((person.points / reward.cost) * 100)) })} style={{ height: 5, borderRadius: 3, backgroundColor: "#edf1ea", overflow: "hidden", marginTop: 12, marginBottom: 6 }}>
                    <View style={{ width: `${progress}%`, height: "100%", backgroundColor: "#8eb699" }} />
                  </View>
                  <Txt variant="meta" color="#879285">
                    {status}
                  </Txt>
                </View>
                <View style={{ alignItems: "flex-end", gap: 4 }}>
                  {!reward.redeemed ? <Button square variant="ghost" icon="trash-2" accessibilityLabel={t("移除{title}", { title: t(reward.title) })} onPress={() => confirmDeleteReward(reward.id)} /> : null}
                  <Button variant={ready ? "primary" : "text"} label={reward.redeemed ? t("已兌換") : t("兌換")} disabled={reward.redeemed || person.points < reward.cost} onPress={() => askRedeem(reward.id)} />
                </View>
              </View>
            );
          })}
        </View>
      ) : (
        <EmptyState icon="gift" title={t("還沒有獎勵目標")} action={{ label: t("新增獎勵"), onPress: openRewardForm }} />
      )}
    </View>
  );
}
