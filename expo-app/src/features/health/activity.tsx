/* 家庭活動 tab (renderHealthFamily): wearable bar, family overview and one activity card per member
 * (step ring, heart rate, minutes, distance, calories) fed by the demo wearable samples. */
import { View } from "react-native";
import Svg, { Circle } from "react-native-svg";
import { Avatar, Button, Icon, Select, Toggle, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { useDeviceStore } from "@/store/device";
import { radius } from "@/theme";
import { fh } from "@/features/family/shared";
import { disconnectWearable, setAutoConnect, setHealth } from "./actions";
import { openWearableDialog } from "./dialogs";
import { STEP_GOAL, wearableFor } from "./estimate";
import { useHealthUiStore } from "./store";

function StepRing({ progress, value, unit }: { progress: number; value: string; unit: string }) {
  const size = 134;
  const stroke = 9;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#e7edde" strokeWidth={stroke} fill="none" />
        <Circle cx={size / 2} cy={size / 2} r={r} stroke="#82aa70" strokeWidth={stroke} fill="none" strokeDasharray={`${c} ${c}`} strokeDashoffset={c * (1 - Math.min(100, Math.max(0, progress)) / 100)} transform={`rotate(-90 ${size / 2} ${size / 2})`} />
      </Svg>
      <Txt variant="h2" weight="600" color="#6c8958">
        {value}
      </Txt>
      <Txt variant="meta" color="#7a846b">
        {unit}
      </Txt>
    </View>
  );
}

function Detail({ icon, iconColor, label, value, unit }: { icon: string; iconColor: string; label: string; value: string; unit: string }) {
  return (
    <View style={{ flexBasis: "45%", flexGrow: 1, minWidth: 0, paddingLeft: 12, borderLeftWidth: 1, borderLeftColor: fh.line }}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
        <Icon name={icon} size={16} color={iconColor} />
        <Txt variant="meta" color="#78836b">
          {label}
        </Txt>
      </View>
      <Txt variant="card" color="#56674a">
        {value}
        <Txt variant="meta" color="#56674a">
          {unit}
        </Txt>
      </Txt>
    </View>
  );
}

export function HealthActivity() {
  const { t, number } = useI18n();
  const { isWide, isPhone } = useBreakpoint();
  const members = useDeviceStore((s) => s.members);
  const health = useDeviceStore((s) => s.health);
  const autoConnect = useHealthUiStore((s) => s.autoConnect);
  const connected = members.filter((person) => wearableFor(health.wearables, person.id));
  const selected = members.find((item) => item.id === health.member) || members[0];
  const selectedData = selected ? wearableFor(health.wearables, selected.id) : undefined;
  const bar: [string, string][] = [
    [t("電量"), selectedData ? "86%" : "--"],
    [t("步數"), selectedData ? number(selectedData.steps) : "--"],
    [t("心率"), selectedData ? String(selectedData.heartRate) : "--"],
    [t("睡眠"), "--"],
    [t("血氧"), "--"],
    ["HRV", "--"],
  ];
  return (
    <View style={{ gap: 20 }}>
      <View style={{ flexDirection: isWide ? "row" : "column", alignItems: isWide ? "center" : "stretch", gap: 20, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: fh.line }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, minWidth: 200 }}>
          <View style={{ width: 44, height: 44, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", backgroundColor: "#edf4e9" }}>
            <Icon name="watch" size={26} color="#608667" />
          </View>
          <View>
            <Txt variant="h3">{t("手環")}</Txt>
            <Txt variant="meta" color="#77836e">
              {selectedData ? t("示範設備已連線") : t("未連線")}
            </Txt>
          </View>
        </View>
        <View style={{ flex: isWide ? 1 : undefined, flexDirection: "row", flexWrap: "wrap" }}>
          {bar.map(([label, value]) => (
            <View key={label} style={{ flexBasis: isPhone ? "33%" : `${100 / 6}%`, alignItems: "center", gap: 6, paddingVertical: 8, paddingHorizontal: 4, borderLeftWidth: 1, borderLeftColor: fh.line }}>
              <Txt variant="h3" weight="500" color="#6c805e">
                {value}
              </Txt>
              <Txt variant="meta" color="#76816b">
                {label}
              </Txt>
            </View>
          ))}
        </View>
        <View style={{ width: isWide ? 340 : undefined, gap: 10 }}>
          <View style={{ flexDirection: "row", alignItems: "flex-end", flexWrap: "wrap", gap: 12 }}>
            {selected ? <Select label={t("資料成員")} accessibilityLabel={t("資料成員")} value={selected.id} options={members.map((m) => ({ value: m.id, label: m.name }))} onChange={(id) => setHealth({ member: id })} style={{ flex: 1, minWidth: 150 }} /> : null}
            <Button icon="link" label={t("綁定手環")} onPress={() => openWearableDialog()} />
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 10, minHeight: 44 }}>
            <Txt variant="meta" color="#6d7d63">
              {t("自動連接")}
            </Txt>
            <Toggle value={autoConnect} onChange={setAutoConnect} accessibilityLabel={t("自動連接")} />
          </View>
        </View>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 18 }}>
        <View style={{ flexGrow: 1, minWidth: 200 }}>
          <Txt variant="h2">{t("家庭活動總覽")}</Txt>
          <Txt variant="meta" muted>
            {connected.length ? t("示範設備 · 範例活動數據") : t("家庭成員已就緒，等待手環資料")}
          </Txt>
        </View>
        <View style={{ flexDirection: "row", gap: 28 }}>
          {[
            [t("家庭成員"), members.length],
            [t("已同步手環"), connected.length],
          ].map(([label, value]) => (
            <View key={String(label)} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Txt variant="h2" weight="600" color="#678353">
                {String(value)}
              </Txt>
              <Txt variant="meta" color="#79856d">
                {String(label)}
              </Txt>
            </View>
          ))}
        </View>
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
        {members.map((person) => {
          const data = wearableFor(health.wearables, person.id);
          const goDetail = () => setHealth({ member: person.id, tab: "profile" });
          return (
            <View key={person.id} style={{ flexBasis: isWide ? "47%" : "100%", flexGrow: 1, minWidth: 0, padding: 18, borderWidth: 1, borderColor: fh.line, borderRadius: radius.md, backgroundColor: "#fff", gap: 16 }}>
              <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                <Avatar color={person.color} initials={person.initial || person.name.slice(0, 1)} size={44} />
                <View style={{ flex: 1, minWidth: 100 }}>
                  <Txt variant="h3">{person.name}</Txt>
                  <Txt variant="meta" muted>
                    {person.role ? t(person.role) : t("家庭成員")}
                  </Txt>
                </View>
                <Button size="sm" variant="soft" label={data ? t("範例活動數據") : t("等待手環資料")} onPress={data ? goDetail : () => openWearableDialog(person.id)} />
                <Button square variant="ghost" icon="chevron-right" accessibilityLabel={t("查看{name}的健康資料", { name: person.name })} onPress={goDetail} />
              </View>
              <View style={{ flexDirection: isPhone ? "column" : "row", alignItems: "center", gap: 20 }}>
                <StepRing progress={data ? (data.steps / STEP_GOAL) * 100 : 0} value={data ? number(data.steps) : "--"} unit={t("步")} />
                <View style={{ flex: isPhone ? undefined : 1, alignSelf: "stretch", flexDirection: "row", flexWrap: "wrap", gap: 16 }}>
                  <Detail icon="heart" iconColor="#c6a67c" label={t("心率")} value={data ? String(data.heartRate) : "--"} unit=" bpm" />
                  <Detail icon="timer" iconColor="#9fb081" label={t("活動時間")} value={data ? String(data.minutes) : "--"} unit={data ? ` ${t("分鐘")}` : ""} />
                  <Detail icon="footprints" iconColor="#9fb081" label={t("距離")} value={data ? String(data.distance) : "--"} unit=" km" />
                  <Detail icon="flame" iconColor="#c6a67c" label={t("活動熱量")} value={data ? String(data.calories) : "--"} unit=" kcal" />
                </View>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
                <Txt variant="meta" color="#758568">
                  {t("每日步數目標")}
                </Txt>
                <Txt variant="meta" weight="500" color="#7a9162">
                  {t("{steps} / 8,000 步", { steps: data ? number(data.steps) : "--" })}
                </Txt>
              </View>
              {data ? <Button variant="text" size="sm" label={t("中斷示範設備")} onPress={() => disconnectWearable(person.id)} style={{ alignSelf: "flex-start", paddingHorizontal: 0, minHeight: 44 }} /> : null}
            </View>
          );
        })}
      </View>
    </View>
  );
}
