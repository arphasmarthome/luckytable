/* 任務與習慣 tab (renderTasks): weekly habit table with star buttons; only today's column is enabled. */
import { Star } from "lucide-react-native";
import { Pressable, ScrollView, View } from "react-native";
import { Button, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { pad2, todayKey } from "@/lib/date";
import { useDeviceStore, type Member, type Task } from "@/store/device";
import { toast } from "@/store/toast";
import { radius } from "@/theme";
import { confirmDeleteTask, openTaskForm } from "./dialogs";
import { EmptyState, fh, useWeek, type WeekDay } from "./shared";

const NAME_W = 220;
const DAY_W = 72;
const WEEK_W = 64;
const MANAGE_W = 116;

function Metric({ label, value, suffix, color }: { label: string; value: string; suffix?: string; color: string }) {
  return (
    <View style={{ minWidth: 90, gap: 2 }}>
      <Txt variant="meta" color={fh.muted}>
        {label}
      </Txt>
      <Txt variant="h1" weight="600" color={color}>
        {value}
        {suffix ? (
          <Txt variant="card" color="#94a097">
            {suffix}
          </Txt>
        ) : null}
      </Txt>
    </View>
  );
}

function StarButton({ task, day, done }: { task: Task; day: WeekDay; done: boolean }) {
  const { t } = useI18n();
  const completeTask = useDeviceStore((s) => s.completeTask);
  const isToday = day.key === todayKey;
  const color = done ? "#c9982a" : isToday ? "#b4c6b9" : "#d1d9d2";
  const label = `${t(task.title)}，${day.longLabel}，${done ? t("已完成") : t("未完成")}${isToday ? (done ? t("，取消完成") : t("，完成任務")) : t("，歷史記錄")}`;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !isToday, checked: done }}
      disabled={!isToday}
      onPress={() => {
        const result = completeTask(task.id);
        if (result.message) toast(result.message);
      }}
      style={({ pressed }) => ({
        width: 54,
        height: 54,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: done ? "#e7d09a" : isToday ? "#9fbcaa" : "transparent",
        backgroundColor: pressed && isToday ? "#fff4d9" : done ? "#fff7df" : isToday ? "#f5faf6" : "transparent",
      })}>
      <Star size={25} color={color} fill={color} strokeWidth={1} />
    </Pressable>
  );
}

export function TasksView({ person }: { person: Member }) {
  const { t, number, monthDay } = useI18n();
  const { isPhone } = useBreakpoint();
  const days = useWeek();
  const tasks = useDeviceStore((s) => s.tasks).filter((task) => task.memberId === person.id);
  const inWeek = (key: string) => days.some((day) => day.key === key);
  const stars = tasks.reduce((total, task) => total + task.completions.filter(inWeek).length, 0);
  const completed = tasks.filter((task) => task.completions.includes(todayKey)).length;
  const headCell = (label: string, width: number, extra?: string, isToday?: boolean) => (
    <View key={label + width} style={{ width, alignItems: "center", justifyContent: "center", paddingVertical: 8, backgroundColor: isToday ? "#eaf3ed" : undefined }}>
      <Txt variant="meta" weight={isToday ? "700" : "500"} color={isToday ? "#376d53" : "#7f8a82"} align="center">
        {label}
      </Txt>
      {extra ? (
        <Txt variant="caption" color={isToday ? "#376d53" : "#7f8a82"} align="center">
          {extra}
        </Txt>
      ) : null}
    </View>
  );
  return (
    <View style={{ gap: 20 }}>
      <View style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: isPhone ? 16 : 28 }}>
        <View style={{ flexGrow: 1, minWidth: 180 }}>
          <Txt variant="h2">{t("本週任務")}</Txt>
          <Txt variant="meta" muted>
            {monthDay(days[0].date)} - {monthDay(days[6].date)}
          </Txt>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 24 }}>
          <Metric label={t("今日完成")} value={String(completed)} suffix={` / ${tasks.length}`} color="#426c57" />
          <Metric label={t("本週星星")} value={String(stars)} color="#426c57" />
          <Metric label={t("可用積分")} value={number(person.points)} color="#b18136" />
        </View>
        <Button variant="primary" icon="plus" label={t("新增任務")} onPress={() => openTaskForm()} />
      </View>
      {tasks.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator contentContainerStyle={{ minWidth: "100%" }}>
          <View style={{ flexGrow: 1, minWidth: NAME_W + DAY_W * 7 + WEEK_W + MANAGE_W }}>
            <View style={{ flexDirection: "row", alignItems: "stretch", backgroundColor: "#f4f7f4", borderBottomWidth: 1, borderBottomColor: fh.line, minHeight: 60 }}>
              <View style={{ flex: 1, minWidth: NAME_W, justifyContent: "center", paddingHorizontal: 16 }}>
                <Txt variant="meta" weight="500" color="#7f8a82">
                  {t("家庭任務")}
                </Txt>
              </View>
              {days.map((day) => headCell(day.label, DAY_W, `${pad2(day.date.getMonth() + 1)}/${pad2(day.date.getDate())}${day.key === todayKey ? t(" · 今天") : ""}`, day.key === todayKey))}
              {headCell(t("本週"), WEEK_W)}
              {headCell(t("管理"), MANAGE_W)}
            </View>
            {tasks.map((task) => (
              <View key={task.id} style={{ flexDirection: "row", alignItems: "center", borderBottomWidth: 1, borderBottomColor: fh.line, minHeight: 84 }}>
                <View style={{ flex: 1, minWidth: NAME_W, paddingHorizontal: 16, paddingVertical: 12 }}>
                  <Txt variant="card" weight="500">
                    {t(task.title)}
                  </Txt>
                  <Txt variant="meta" color="#869286">
                    {t("每天 +{n} 積分", { n: task.points })}
                  </Txt>
                </View>
                {days.map((day) => (
                  <View key={day.key} style={{ width: DAY_W, alignItems: "center", paddingVertical: 10 }}>
                    <StarButton task={task} day={day} done={task.completions.includes(day.key)} />
                  </View>
                ))}
                <View style={{ width: WEEK_W, alignItems: "center" }}>
                  <Txt variant="card" weight="600" color="#a3823f">
                    {String(task.completions.filter(inWeek).length)}
                  </Txt>
                </View>
                <View style={{ width: MANAGE_W, flexDirection: "row", justifyContent: "center", gap: 4 }}>
                  <Button square variant="ghost" icon="pencil" accessibilityLabel={t("編輯{title}", { title: t(task.title) })} onPress={() => openTaskForm(task.id)} />
                  <Button square variant="ghost" icon="trash-2" accessibilityLabel={t("刪除{title}", { title: t(task.title) })} onPress={() => confirmDeleteTask(task.id)} />
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      ) : (
        <EmptyState icon="check-check" title={t("還沒有家庭任務")} action={{ label: t("新增任務"), onPress: () => openTaskForm() }} />
      )}
    </View>
  );
}
