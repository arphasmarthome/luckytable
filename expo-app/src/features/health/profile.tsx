/* 個人健康 tab (renderHealthProfile): basics, adult BMI / calorie summary or child growth note,
 * plate suggestions, recipe band and the recent weight records. */
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { View } from "react-native";
import { Button, Icon, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import type { Member } from "@/store/device";
import { radius } from "@/theme";
import { EmptyState, fh, LocalLabel } from "@/features/family/shared";
import { openHealthForm } from "./dialogs";
import { activityLabel, foodSuggestions, goalNames, healthEstimate } from "./estimate";

const recipeImage = require("../../../assets/images/lucky/recipe-preparation.webp");

function Basic({ label, value, unit, wide }: { label: string; value: string; unit?: string; wide?: boolean }) {
  return (
    <View style={{ flexBasis: wide ? "100%" : "45%", flexGrow: 1, minWidth: 0, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: fh.line }}>
      <Txt variant="meta" color="#6e786f" style={{ marginBottom: 4 }}>
        {label}
      </Txt>
      <Txt variant={wide ? "h3" : "h2"} weight="600">
        {value}
        {unit ? (
          <Txt variant="meta" color="#7b847b">
            {unit}
          </Txt>
        ) : null}
      </Txt>
    </View>
  );
}

function Calorie({ label, value, last }: { label: string; value: string; last?: boolean }) {
  const { t } = useI18n();
  return (
    <View style={{ flex: 1, minWidth: 90 }}>
      <Txt variant="meta" color="#6f796b" style={{ marginBottom: 8 }}>
        {label}
      </Txt>
      <Txt variant="h1" weight="600" color={last ? "#aa8c4d" : "#44513f"}>
        {value}
      </Txt>
      <Txt variant="meta" color="#7c8373">
        {t("kcal/日")}
      </Txt>
    </View>
  );
}

export function HealthProfile({ person }: { person: Member }) {
  const { t, number } = useI18n();
  const { isWide, isPhone } = useBreakpoint();
  const router = useRouter();
  const p = person.health;
  if (!p || !p.height || !p.weight) {
    return <EmptyState icon="heart-pulse" title={t("新增 {name} 的健康資料", { name: person.name })} action={{ label: t("新增資料"), onPress: () => openHealthForm(person.id) }} />;
  }
  const estimate = healthEstimate(p);
  const records = p.records.slice(-7);
  const maxWeight = Math.max(...records.map((item) => Number(item.weight)), 1);
  const foods = foodSuggestions(person);
  const child = p.age < 18;

  const basics = (
    <View style={{ width: isWide ? 320 : undefined, paddingRight: isWide ? 24 : 0, borderRightWidth: isWide ? 1 : 0, borderColor: fh.line, gap: 12 }}>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <Txt variant="h2">{t("基本資料")}</Txt>
        <Txt variant="meta" color="#8b9885">
          {t("已儲存")}
        </Txt>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", columnGap: 16 }}>
        <Basic label={t("身高")} value={String(p.height)} unit=" cm" />
        <Basic label={t("體重")} value={String(p.weight)} unit=" kg" />
        <Basic label={t("年齡")} value={String(p.age)} unit={` ${t("歲")}`} />
        <Basic label={t("性別")} value={p.sex === "female" ? t("女性") : t("男性")} />
        <Basic label={t("健康目標")} value={child ? t("成長記錄") : t(goalNames[p.goal] || goalNames.maintain)} wide />
        <Basic label={t("活動程度")} value={t(activityLabel(p.activity))} wide />
      </View>
      <View style={{ marginTop: 12 }}>
        <LocalLabel>{t("本次原型資料")}</LocalLabel>
      </View>
    </View>
  );

  const summary = estimate ? (
    <View style={{ flexDirection: isWide ? "row" : "column", gap: isWide ? 40 : 20 }}>
      <View style={{ flex: 1, minWidth: 0, gap: 10 }}>
        <Txt variant="meta" color="#727d70">
          {t(goalNames[p.goal] || goalNames.maintain)}
        </Txt>
        <View style={{ flexDirection: "row", alignItems: "baseline", flexWrap: "wrap", gap: 16 }}>
          <Txt variant="hero" weight="600" color="#487451">
            {estimate.bmi.toFixed(1)}{" "}
            <Txt variant="card" weight="500" color="#487451">
              BMI
            </Txt>
          </Txt>
          <Txt variant="card" weight="500" color="#6d895c">
            {estimate.label}
          </Txt>
        </View>
        <Txt color="#687363">{t("每日目標 {n} kcal", { n: number(estimate.target) })}</Txt>
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8, marginTop: 8 }}>
          {[t("偏低"), t("正常範圍"), t("偏高"), t("較高")].map((label) => (
            <Txt key={label} variant="caption" color="#798274">
              {label}
            </Txt>
          ))}
        </View>
        <View accessibilityRole="image" accessibilityLabel={t("成人 BMI {bmi}，{label}", { bmi: estimate.bmi.toFixed(1), label: estimate.label })} style={{ flexDirection: "row", height: 6, marginBottom: 6 }}>
          <View style={{ flex: 6.5, backgroundColor: "#afcad0" }} />
          <View style={{ flex: 6.5, backgroundColor: "#a6bc97" }} />
          <View style={{ flex: 5, backgroundColor: "#dfcb87" }} />
          <View style={{ flex: 10, backgroundColor: "#dba88d" }} />
          <View style={{ position: "absolute", left: `${estimate.marker}%`, top: -3, width: 12, height: 12, marginLeft: -6, borderRadius: 6, borderWidth: 3, borderColor: "#678461", backgroundColor: "#fff" }} />
        </View>
      </View>
      <View style={{ flex: isWide ? 1.05 : undefined, flexDirection: "row", flexWrap: "wrap", gap: 20, borderLeftWidth: isWide ? 1 : 0, borderTopWidth: isWide ? 0 : 1, borderColor: fh.line, paddingLeft: isWide ? 28 : 0, paddingTop: isWide ? 0 : 16 }}>
        <Calorie label={t("基礎代謝")} value={number(estimate.bmr)} />
        <Calorie label={t("維持")} value={number(estimate.maintenance)} />
        <Calorie label={t("目標")} value={number(estimate.target)} last />
      </View>
    </View>
  ) : (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 18, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: fh.line }}>
      <Icon name="heart" size={30} color="#c99978" />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Txt variant="h3">{t("關注成長，均衡飲食")}</Txt>
        <Txt color="#8b9b7e">{t("兒童與青少年的生長情況需結合年齡和生長曲線評估，不套用成人 BMI 與熱量目標。")}</Txt>
      </View>
    </View>
  );

  return (
    <View style={{ flexDirection: isWide ? "row" : "column", gap: isWide ? 32 : 24 }}>
      {basics}
      <View style={{ flex: 1, minWidth: 0, gap: 12 }}>
        <Txt variant="h2">{t("健康摘要")}</Txt>
        {summary}
        {estimate ? (
          <Txt variant="caption" color="#98a28e">
            {t("成人參考區間 18.5-24.9；估算僅供參考，不用於醫療診斷。")}
          </Txt>
        ) : null}
        <View style={{ paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: fh.line, gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <Txt variant="h3">{t("餐盤搭配")}</Txt>
            <Txt variant="meta" muted>
              {child ? t("成長飲食參考") : t("每餐份量參考")}
            </Txt>
          </View>
          <View style={{ flexDirection: isPhone ? "column" : "row", gap: 20 }}>
            {foods.map((food) => (
              <View key={food.group} style={{ flex: isPhone ? undefined : 1, minWidth: 0, paddingLeft: 14, borderLeftWidth: 3, borderLeftColor: "#e2ead7" }}>
                <Txt variant="meta" color="#77836e">
                  {t(food.group)}
                </Txt>
                <Txt variant="card" weight="500">
                  {t(food.name)}
                </Txt>
                <Txt variant="meta" color="#a68e60">
                  {t(food.amount)}
                </Txt>
              </View>
            ))}
          </View>
        </View>
        <Txt variant="h3">{t("料理推薦")}</Txt>
        <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: fh.line }}>
          <Image source={recipeImage} accessibilityLabel={t("豆腐、蔬菜與均衡搭配的家庭料理")} contentFit="cover" style={{ width: 96, height: 96, borderRadius: radius.sm }} />
          <View style={{ flex: 1, minWidth: 180, gap: 6 }}>
            <Txt variant="h3">{t("均衡家常料理")}</Txt>
            <Txt variant="meta" muted>
              {t("蔬菜 · 優質蛋白 · 全穀物")}
            </Txt>
            {person.allergy ? (
              <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                <Icon name="shield-alert" size={16} color="#af9364" />
                <Txt variant="meta" color="#af9364">
                  {t("忌口：{allergy}", { allergy: t(person.allergy) })}
                </Txt>
              </View>
            ) : null}
            <Button variant="text" iconRight="arrow-right" label={t("查看健康料理")} onPress={() => router.navigate("/make/recipes?filter=healthy" as never)} style={{ alignSelf: "flex-start", paddingHorizontal: 0 }} />
          </View>
        </View>
        {records.length ? (
          <View style={{ gap: 10 }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Txt variant="h3">{t("最近體重記錄")}</Txt>
              <Txt variant="meta" muted>
                kg
              </Txt>
            </View>
            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 20, flexWrap: "wrap" }}>
              {records.map((record) => (
                <View key={record.date} style={{ alignItems: "center", gap: 6 }}>
                  <Txt variant="meta" color="#719165">
                    {String(record.weight)}
                  </Txt>
                  <View style={{ width: 24, height: Math.max(8, (Number(record.weight) / maxWeight) * 64), backgroundColor: "#a3ba95", borderTopLeftRadius: 3, borderTopRightRadius: 3 }} />
                  <Txt variant="caption" color="#96a287">
                    {record.date.slice(5).replace("-", "/")}
                  </Txt>
                </View>
              ))}
            </View>
          </View>
        ) : null}
      </View>
    </View>
  );
}
