/* 成長足跡 tab (renderGrowth): month calendar or year grid of completed stars, metric tiles and the task record list.
 * Archived (deleted) tasks still count here. */
import { Pressable, View } from "react-native";
import { Button, Icon, Segmented, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { pad2, todayKey } from "@/lib/date";
import { useDeviceStore, type Member } from "@/store/device";
import { radius } from "@/theme";
import { setFamily, stepGrowthPeriod } from "./actions";
import { fh } from "./shared";

function MetricTile({ icon, iconColor, value, label, note, last }: { icon: string; iconColor: string; value: string; label: string; note: string; last?: boolean }) {
  const { isPhone } = useBreakpoint();
  return (
    <View style={{ flex: isPhone ? undefined : 1, flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 14, paddingHorizontal: isPhone ? 0 : 16, borderRightWidth: !isPhone && !last ? 1 : 0, borderBottomWidth: isPhone && !last ? 1 : 0, borderColor: fh.line }}>
      <Icon name={icon} size={28} color={iconColor} />
      <Txt variant="h1" weight="600" color="#426c51">
        {value}
      </Txt>
      <View style={{ flexShrink: 1 }}>
        <Txt variant="card">{label}</Txt>
        <Txt variant="meta" color="#8b9588">
          {note}
        </Txt>
      </View>
    </View>
  );
}

export function GrowthView({ person }: { person: Member }) {
  const { t, monthYear, yearLabel, monthName, weekday, number } = useI18n();
  const { isPhone, isWide } = useBreakpoint();
  const family = useDeviceStore((s) => s.family);
  const allTasks = useDeviceStore((s) => s.tasks);
  const archived = useDeviceStore((s) => s.archivedTasks);
  const selected = family.growthMonth || todayKey.slice(0, 7);
  const [year, month] = selected.split("-").map(Number);
  const yearly = family.growthMode === "year";
  const prefix = yearly ? String(year) : selected;
  const tasks = [...allTasks, ...archived].filter((task) => task.memberId === person.id);
  const dates = tasks.flatMap((task) => task.completions).filter((date) => date.startsWith(prefix));
  const earned = tasks.reduce((sum, task) => sum + task.completions.filter((date) => date.startsWith(prefix)).reduce((points, date) => points + (task.completionPoints[date] ?? task.points), 0), 0);
  const lastDay = new Date(year, month, 0).getDate();
  const offset = new Date(year, month - 1, 1).getDay();
  const cellWidth = `${100 / 7}%` as const;

  const monthGrid = (
    <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
      {[0, 1, 2, 3, 4, 5, 6].map((day) => (
        <View key={`w${day}`} style={{ width: cellWidth, height: 44, alignItems: "center", justifyContent: "center" }}>
          <Txt variant="meta" color="#7e897c">
            {weekday(day, "short")}
          </Txt>
        </View>
      ))}
      {Array.from({ length: offset }, (_, i) => (
        <View key={`o${i}`} style={{ width: cellWidth, height: 57 }} />
      ))}
      {Array.from({ length: lastDay }, (_, i) => {
        const key = `${selected}-${pad2(i + 1)}`;
        const count = dates.filter((date) => date === key).length;
        const isToday = key === todayKey;
        return (
          <View key={key} style={{ width: cellWidth, height: 57, alignItems: "center", justifyContent: "center" }}>
            <View accessibilityLabel={t("{date} · 完成 {n} 次", { date: key, n: count })} style={{ width: 48, height: 48, borderRadius: radius.sm, alignItems: "center", justifyContent: "center", backgroundColor: count ? "#eef3de" : "transparent", borderWidth: isToday ? 1 : 0, borderColor: "#8fa78e" }}>
              <Txt variant="control" weight={count ? "700" : "400"} color={count ? "#627c43" : "#7c897d"}>
                {String(i + 1)}
              </Txt>
              {count ? (
                <Txt variant="caption" color="#627c43" style={{ fontSize: 11, lineHeight: 13 }}>
                  {t("{n} 星", { n: count })}
                </Txt>
              ) : null}
            </View>
          </View>
        );
      })}
    </View>
  );

  const yearGrid = (
    <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
      {Array.from({ length: 12 }, (_, i) => {
        const key = `${year}-${pad2(i + 1)}`;
        const count = dates.filter((date) => date.startsWith(key)).length;
        return (
          <Pressable
            key={key}
            accessibilityRole="button"
            accessibilityLabel={`${monthName(i, "short")} · ${t("{n} 星", { n: count })}`}
            onPress={() => setFamily({ growthMonth: key, growthMode: "month" })}
            style={({ pressed }) => ({ flexBasis: isPhone ? "30%" : "22%", flexGrow: 1, minHeight: 100, alignItems: "center", justifyContent: "center", gap: 4, borderWidth: 1, borderColor: "#e1e7dc", borderRadius: radius.sm, backgroundColor: pressed ? "#eef3de" : "#fbfcf8" })}>
            <Txt variant="meta" color="#7b8575">
              {monthName(i, "short")}
            </Txt>
            <Txt variant="h2" weight="600" color="#7a9459">
              {String(count)}
            </Txt>
            <Txt variant="caption" color="#7b8575">
              {t("完成星星")}
            </Txt>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={{ gap: 20 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
        <Txt variant="h2" style={{ flexGrow: 1 }}>
          {t("成長足跡")}
        </Txt>
        <Segmented
          accessibilityLabel={t("成長足跡")}
          value={yearly ? "year" : "month"}
          options={[
            { value: "month", label: t("月度") },
            { value: "year", label: t("年度") },
          ]}
          onChange={(mode) => setFamily({ growthMode: mode })}
        />
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Button square variant="ghost" icon="chevron-left" accessibilityLabel={t("上一期")} onPress={() => stepGrowthPeriod(-1)} />
          <Txt variant="h3" align="center" style={{ minWidth: isPhone ? 120 : 200 }}>
            {yearly ? yearLabel(year) : monthYear(new Date(year, month - 1, 1))}
          </Txt>
          <Button square variant="ghost" icon="chevron-right" accessibilityLabel={t("下一期")} onPress={() => stepGrowthPeriod(1)} />
        </View>
      </View>
      <View style={{ flexDirection: isPhone ? "column" : "row", borderTopWidth: 1, borderBottomWidth: 1, borderColor: fh.line }}>
        <MetricTile icon="trophy" iconColor="#87a18b" value={number(person.points)} label={t("可用積分")} note={t("跨月、跨年不清零")} />
        <MetricTile icon="star" iconColor="#bb9849" value={String(dates.length)} label={t("完成星星")} note={yearly ? t("本年度紀錄") : t("本月紀錄")} />
        <MetricTile icon="circle-check" iconColor="#87a18b" value={String(earned)} label={t("獲得點數")} note={t("完成任務所得")} last />
      </View>
      <View style={{ flexDirection: isWide ? "row" : "column", gap: isWide ? 32 : 24 }}>
        <View style={{ flex: isWide ? 1.4 : undefined, minWidth: 0 }}>{yearly ? yearGrid : monthGrid}</View>
        <View style={{ flex: isWide ? 1 : undefined, minWidth: 0, borderLeftWidth: isWide ? 1 : 0, borderTopWidth: isWide ? 0 : 1, borderColor: fh.line, paddingLeft: isWide ? 28 : 0, paddingTop: isWide ? 0 : 20 }}>
          <Txt variant="h3">{t("任務紀錄")}</Txt>
          <Txt variant="meta" muted style={{ marginBottom: 8 }}>
            {t("進行中與已封存任務")}
          </Txt>
          {tasks.length ? (
            tasks.map((task) => {
              const count = task.completions.filter((date) => date.startsWith(prefix)).length;
              return (
                <View key={task.id} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: fh.line }}>
                  <View style={{ width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", backgroundColor: "#f1f5e8" }}>
                    <Txt weight="700" color="#7e975d">
                      {String(count)}
                    </Txt>
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt variant="card" weight="500">
                      {t(task.title)}
                    </Txt>
                    <Txt variant="meta" color="#8a9383">
                      {t("每天 +{n} 積分", { n: task.points })}
                    </Txt>
                  </View>
                  <View style={{ alignItems: "flex-end" }}>
                    <Txt variant="meta" color="#7f9475">
                      {task.archived ? t("已封存") : t("進行中")}
                    </Txt>
                    <Txt variant="caption" color="#7f9475">
                      {t("完成 {n} 次", { n: count })}
                    </Txt>
                  </View>
                </View>
              );
            })
          ) : (
            <Txt muted>{t("尚無任務紀錄")}</Txt>
          )}
        </View>
      </View>
    </View>
  );
}
