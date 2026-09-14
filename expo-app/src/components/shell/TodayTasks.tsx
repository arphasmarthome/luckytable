import { useRouter } from "expo-router";
import { Pressable, View } from "react-native";
import { Button, EmptyNote, Icon, Txt } from "@/components/ui";
import { useI18n } from "@/i18n";
import { todayKey } from "@/lib/date";
import { dialog } from "@/store/dialog";
import { memberById, useDeviceStore } from "@/store/device";
import { toast } from "@/store/toast";
import { shell } from "@/theme";

/** "今日家庭任務" list shown in the top-bar dialog (the prototype's taskMarkup). */
export function TodayTasksList() {
  const router = useRouter();
  const { t } = useI18n();
  const tasks = useDeviceStore((s) => s.tasks);
  const members = useDeviceStore((s) => s.members);
  const completeTask = useDeviceStore((s) => s.completeTask);
  if (!tasks.length) {
    return (
      <View>
        <EmptyNote>{t("尚未設定任務")}</EmptyNote>
        <Button
          variant="text"
          label={t("新增家庭任務")}
          onPress={() => {
            dialog.close();
            router.navigate("/family" as never);
          }}
        />
      </View>
    );
  }
  return (
    <View>
      {tasks.map((task) => {
        const done = task.completions.includes(todayKey);
        const owner = memberById(task.memberId, members);
        return (
          <View key={task.id} style={{ flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: shell.line }}>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ checked: done }}
              accessibilityLabel={`${done ? t("取消完成") : t("完成")} ${t(task.title)}`}
              onPress={() => {
                const result = completeTask(task.id);
                if (result.message) toast(result.message);
              }}
              style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
              <Icon name={done ? "circle-check" : "circle"} size={26} color={done ? shell.green : shell.muted} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Txt weight="600" style={done ? { textDecorationLine: "line-through", color: shell.muted } : undefined}>
                {t(task.title)}
              </Txt>
              <Txt variant="meta" muted>
                {owner.name}
              </Txt>
            </View>
            <Txt weight="700" color={shell.green}>
              +{task.points || 5}
            </Txt>
          </View>
        );
      })}
    </View>
  );
}
