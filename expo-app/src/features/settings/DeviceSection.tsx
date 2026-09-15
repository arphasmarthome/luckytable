/* Settings → 裝置與資料 (prototype deviceSettingsMarkup). */
import { Platform, View } from "react-native";
import { Button, Icon, Toggle, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { useDeviceStore } from "@/store/device";
import { toast } from "@/store/toast";
import { radius, shell } from "@/theme";
import { openDeviceIdDialog, openDhcpDialog, openDownloadDialog, openFamilyNameDialog, openInstallDialog, openNetworkDialog, openPairingDialog, openSyncDialog, openSystemUpdateDialog } from "./dialogs";
import { SectionHeader, SettingsGroup, SettingsRow } from "./SettingsRow";

const DEMO_IP = "192.168.1.108";

function DeviceInformation() {
  const { t } = useI18n();
  const version = useDeviceStore((s) => s.settings.version);
  const deviceId = useDeviceStore((s) => s.settings.deviceId);
  const familyName = useDeviceStore((s) => s.settings.familyName);
  const rows: [string, string][] = [
    [t("裝置編號"), deviceId],
    [t("螢幕解析度"), "1920 × 1080"],
    [t("可用儲存空間"), "18 GB / 19 GB"],
    [t("目前版本"), version],
  ];
  return (
    <View style={{ backgroundColor: shell.surface, borderWidth: 1, borderColor: shell.line, borderRadius: radius.md, padding: 22, gap: 12 }}>
      <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: shell.greenSoft, alignItems: "center", justifyContent: "center" }}>
        <Icon name="monitor" size={26} color={shell.green} />
      </View>
      <View>
        <Txt variant="h3">Lucky Table LT-15</Txt>
        <Txt muted>{t(familyName)}</Txt>
      </View>
      <View>
        {rows.map(([label, value]) => (
          <View key={label} style={{ flexDirection: "row", justifyContent: "space-between", gap: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: shell.line }}>
            <Txt variant="meta" muted>
              {label}
            </Txt>
            <Txt variant="meta" weight="600" align="right">
              {value}
            </Txt>
          </View>
        ))}
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8, alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: shell.surfaceMuted }}>
        <Icon name="flask-conical" size={16} color={shell.muted} />
        <Txt variant="caption" muted>
          {t("本機演示裝置")}
        </Txt>
      </View>
    </View>
  );
}

export function DeviceSection() {
  const { t } = useI18n();
  const { isDesktop } = useBreakpoint();
  const settings = useDeviceStore((s) => s.settings);
  const setSettings = useDeviceStore((s) => s.setSettings);
  const eventCount = useDeviceStore((s) => s.events.length);
  const taskCount = useDeviceStore((s) => s.tasks.length);
  const updated = () => toast(t("設定已更新 · 本次操作有效"));
  const copyIp = async () => {
    try {
      if (Platform.OS !== "web" || typeof navigator === "undefined" || !navigator.clipboard) throw new Error("clipboard unavailable");
      await navigator.clipboard.writeText(DEMO_IP);
      toast(t("已複製示例 IP"));
    } catch {
      toast(t("示例 IP：192.168.1.108"));
    }
  };
  const groups = (
    <View style={{ flex: 1, minWidth: 0 }}>
      <SettingsGroup title={t("裝置")}>
        <SettingsRow title={t("裝置編號")} detail={settings.deviceId} control={<Button icon="pencil" label={t("變更")} onPress={openDeviceIdDialog} />} />
        <SettingsRow title={t("家庭名稱")} detail={t(settings.familyName)} control={<Button icon="pencil" label={t("變更")} onPress={openFamilyNameDialog} />} />
      </SettingsGroup>
      <SettingsGroup title={t("網路與連結")}>
        <SettingsRow
          title="Wi-Fi"
          detail={settings.wifi ? t("已開啟") : t("已關閉")}
          control={
            <Toggle
              value={settings.wifi}
              accessibilityLabel="Wi-Fi"
              onChange={(wifi) => {
                setSettings({ wifi });
                updated();
              }}
            />
          }
        />
        <SettingsRow title={t("目前網路")} detail={settings.wifi ? settings.network : t("尚未連線")} control={<Button icon="wifi" label={t("切換網路")} onPress={openNetworkDialog} />} />
        <SettingsRow
          title={t("IP 位址")}
          detail={`${DEMO_IP} · DHCP`}
          control={
            <>
              <Button square icon="copy" accessibilityLabel={t("複製 IP 位址")} onPress={() => void copyIp()} />
              <Button square icon="refresh-cw" accessibilityLabel={t("檢查網路")} onPress={() => toast(settings.wifi ? t("演示檢查完成：{network} 可用", { network: settings.network }) : t("演示離線：請先開啟 Wi-Fi"))} />
              <Button square icon="server-cog" accessibilityLabel={t("恢復 DHCP")} onPress={openDhcpDialog} />
            </>
          }
        />
        <SettingsRow title={t("連結手機")} detail={settings.phones.length ? `${settings.phones.map((p) => t(p.name)).join(", ")} · ${t("{n} 支手機已連結", { n: settings.phones.length })}` : t("尚未連結")} control={<Button icon="smartphone" label={t("管理連結")} onPress={openPairingDialog} />} />
        <SettingsRow
          title={t("家庭同步")}
          detail={`${settings.synced ? t("已同步") : t("未同步")} · ${t("{events} 個行程 · {tasks} 個家庭任務", { events: eventCount, tasks: taskCount })}`}
          control={
            <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
              <Icon name={settings.synced ? "circle-check" : "circle-x"} size={24} color={settings.synced ? shell.green : shell.danger} />
              <Button label={settings.synced ? t("已同步") : t("同步")} variant={settings.synced ? "soft" : "secondary"} onPress={openSyncDialog} />
            </View>
          }
        />
      </SettingsGroup>
      <SettingsGroup title={t("資源與更新")}>
        <SettingsRow title={t("離線食譜")} detail={settings.offlineDownloaded ? t("12 道食譜 · 已就緒") : t("12 道食譜 · 86 MB")} control={<Button icon="download" label={settings.offlineDownloaded ? t("重新下載") : t("下載")} disabled={!settings.wifi} onPress={openDownloadDialog} />} />
        <SettingsRow
          title={t("系統更新")}
          detail={`${settings.version}${settings.updateAvailable ? t(" · 可更新至 0.19.0") : t(" · 已是最新版本")}`}
          control={
            settings.updateAvailable ? (
              <Button variant="primary" icon="download" label={t("立即更新")} disabled={!settings.wifi} onPress={openInstallDialog} />
            ) : (
              <Button icon="refresh-cw" label={t("檢查更新")} onPress={openSystemUpdateDialog} />
            )
          }
        />
      </SettingsGroup>
    </View>
  );
  return (
    <View>
      <SectionHeader title={t("裝置與資料")} />
      {isDesktop ? (
        <View style={{ flexDirection: "row", gap: 42, alignItems: "flex-start" }}>
          {groups}
          <View style={{ width: 312 }}>
            <DeviceInformation />
          </View>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {groups}
          <DeviceInformation />
        </View>
      )}
    </View>
  );
}
