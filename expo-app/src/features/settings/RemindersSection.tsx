/* Settings → 家庭提醒. */
import { View } from "react-native";
import { Button, Select, Toggle } from "@/components/ui";
import { useI18n } from "@/i18n";
import { useDeviceStore } from "@/store/device";
import { toast } from "@/store/toast";
import { openNotificationDialog, openReminderPreview } from "./dialogs";
import { SectionHeader, SettingsGroup, SettingsRow } from "./SettingsRow";

const LEAD_TIMES = [0, 5, 15, 30, 60];

export function RemindersSection() {
  const { t } = useI18n();
  const settings = useDeviceStore((s) => s.settings);
  const setSettings = useDeviceStore((s) => s.setSettings);
  const updated = () => toast(t("設定已更新 · 本次操作有效"));
  return (
    <View>
      <SectionHeader title={t("家庭提醒")} />
      <SettingsGroup>
        <SettingsRow
          title={t("行程提醒")}
          detail={settings.reminders ? t("已開啟") : t("已關閉")}
          control={
            <Toggle
              value={settings.reminders}
              accessibilityLabel={t("行程提醒")}
              onChange={(reminders) => {
                setSettings({ reminders });
                updated();
              }}
            />
          }
        />
        <SettingsRow
          title={t("提前提醒")}
          detail={t("家庭行程的預設提醒時間")}
          control={
            <Select<number>
              accessibilityLabel={t("提前提醒")}
              title={t("提前提醒")}
              disabled={!settings.reminders}
              value={LEAD_TIMES.includes(settings.leadTime) ? settings.leadTime : 15}
              options={LEAD_TIMES.map((n) => ({ value: n, label: n ? t("提前 {n} 分鐘", { n }) : t("準時") }))}
              onChange={(leadTime) => {
                setSettings({ leadTime });
                updated();
              }}
              style={{ minWidth: 220 }}
            />
          }
        />
        <SettingsRow title={t("通知權限")} detail={settings.notificationPermission ? t("演示已允許") : t("尚未授權")} control={<Button icon="bell" label={settings.notificationPermission ? t("檢視權限") : t("設定權限")} onPress={openNotificationDialog} />} />
        <SettingsRow title={t("提醒預覽")} detail={t("家庭行程")} control={<Button icon="eye" label={t("預覽提醒")} onPress={openReminderPreview} />} />
      </SettingsGroup>
    </View>
  );
}
