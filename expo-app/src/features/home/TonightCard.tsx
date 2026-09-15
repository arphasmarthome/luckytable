/* Home → 今晚的菜色 (prototype tonightDishesMarkup). */
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { Button, EmptyNote, Icon, Txt } from "@/components/ui";
import { useMakeSummary, type TonightDish } from "@/features/make/summary";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { cookIndexToday, useDeviceStore } from "@/store/device";
import { radius, shell } from "@/theme";
import { HomeCard, Pill } from "./HomeCard";

function DishRow({ dish, meta }: { dish: TonightDish; meta: string }) {
  const router = useRouter();
  const { t } = useI18n();
  const { isPhone } = useBreakpoint();
  const thumb = isPhone ? { width: 88, height: 64 } : { width: 92, height: 66 };
  const badge = dish.cooked ? t("已完成") : dish.ready ? t("食材齊全") : t("缺 {n} 項", { n: dish.missing });
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={dish.name}
      onPress={() => router.navigate(`/make/dish/${dish.id}` as never)}
      style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: isPhone ? 12 : 14, padding: 6, paddingRight: 12, borderWidth: 1, borderColor: pressed ? "#a7c4b5" : shell.line, borderRadius: radius.md, backgroundColor: pressed ? "#f7faf8" : "#fff" })}>
      <View style={{ ...thumb, borderRadius: radius.sm, overflow: "hidden", backgroundColor: "#edf1ee", alignItems: "center", justifyContent: "center" }}>
        {dish.img ? <Image source={{ uri: dish.img }} style={{ width: "100%", height: "100%" }} contentFit="cover" accessibilityLabel="" /> : <Icon name="utensils" size={28} color={shell.muted} />}
      </View>
      <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
        <Txt variant="body" weight="600" numberOfLines={1}>
          {dish.name}
        </Txt>
        <Txt variant="meta" muted numberOfLines={1}>
          {meta}
        </Txt>
        <Pill label={badge} tone={dish.ready ? "green" : "short"} />
      </View>
    </Pressable>
  );
}

export function TonightCard() {
  const router = useRouter();
  const { t, list } = useI18n();
  const { tonight, allReady, cooking } = useMakeSummary();
  const members = useDeviceStore((s) => s.members);
  const dinnerMembers = useDeviceStore((s) => s.dinnerMembers);
  const dinnerTime = useDeviceStore((s) => s.dinner.time);
  const diners = members.filter((m) => dinnerMembers.includes(m.id));
  const cooks = members.filter((m) => m.prefs && m.prefs.cook[cookIndexToday]);
  const cookLabel = cooks.length ? list(cooks.map((m) => m.name)) : t("全家");
  return (
    <HomeCard
      title={t("今晚的菜色")}
      aside={
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Pill label={diners.length ? t("{n} 人一起吃", { n: diners.length }) : t("尚未有人加入")} tone={diners.length ? "green" : "off"} />
          {tonight.length ? <Button size="sm" variant="primary" icon="flame" label={cooking ? t("繼續料理") : t("開始料理")} disabled={!cooking && !allReady} accessibilityLabel={!cooking && !allReady ? t("先補齊缺少的食材") : undefined} onPress={() => router.navigate("/make/cook" as never)} /> : null}
        </View>
      }
      style={{ flex: 1 }}>
      {tonight.length ? (
        <View style={{ gap: 12 }}>
          {tonight.map((dish) => (
            <DishRow key={dish.id} dish={dish} meta={`${dinnerTime} · ${cookLabel} · ${dish.minutes} ${t("分鐘")}`} />
          ))}
        </View>
      ) : (
        <EmptyNote>{t("今晚還沒有菜單")}</EmptyNote>
      )}
    </HomeCard>
  );
}
