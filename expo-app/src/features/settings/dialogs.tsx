/* Settings demo dialogs (prototype networkDialog / pairingDialog / showReminder and the data-action modals).
 * Every one is a demo: it changes store state only and says so in a DemoNotice. */
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Button, DemoNotice, Icon, TextField, Txt } from "@/components/ui";
import { t } from "@/i18n";
import { memberById, todaysEvents, useDeviceStore } from "@/store/device";
import { dialog } from "@/store/dialog";
import { toast } from "@/store/toast";
import { radius, shell } from "@/theme";

const NETWORKS = ["Family_WiFi", "LuckyTable_Guest", "Home_5G"];

/* 切換網路 — pick a network + demo password (min 8 chars), "模擬連線". The Select kit component opens the shared
   dialog and would replace this one, so the network list is an inline radio list. */
function NetworkForm() {
  const initial = useDeviceStore.getState().settings.network;
  const [network, setNetwork] = useState(NETWORKS.includes(initial) ? initial : NETWORKS[0]);
  const [password, setPassword] = useState("");
  const valid = password.length >= 8;
  const submit = () => {
    if (!valid) return;
    useDeviceStore.getState().setSettings({ network, wifi: true });
    dialog.close();
    toast(t("演示網路已切換，未修改實際 Wi-Fi"));
  };
  return (
    <View style={{ gap: 16 }}>
      <DemoNotice>{t("網路連線演示，不會更改電腦或設備的 Wi-Fi。")}</DemoNotice>
      <View style={{ gap: 8 }}>
        <Txt variant="control" weight="500">
          {t("可用網路")}
        </Txt>
        <View accessibilityRole="radiogroup" style={{ borderWidth: 1, borderColor: shell.inputBorder, borderRadius: radius.sm, overflow: "hidden" }}>
          {NETWORKS.map((name, i) => {
            const active = name === network;
            return (
              <Pressable
                key={name}
                accessibilityRole="radio"
                accessibilityState={{ selected: active }}
                onPress={() => setNetwork(name)}
                style={({ pressed }) => ({ flexDirection: "row", alignItems: "center", gap: 12, minHeight: 52, paddingHorizontal: 14, borderTopWidth: i ? 1 : 0, borderTopColor: shell.line, backgroundColor: active ? shell.greenSoft : pressed ? shell.surfaceMuted : "#fff" })}>
                <Icon name={active ? "circle-check" : "circle"} size={20} color={active ? shell.green : shell.muted} />
                <Txt variant="control" weight={active ? "600" : "400"} color={active ? shell.green : shell.ink}>
                  {name}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </View>
      <TextField label={t("密碼")} value={password} onChangeText={setPassword} secureTextEntry autoComplete="off" autoCapitalize="none" placeholder={t("至少 8 個字元")} onSubmitEditing={submit} />
      <Button variant="primary" label={t("模擬連線")} disabled={!valid} onPress={submit} style={{ alignSelf: "flex-start" }} />
    </View>
  );
}
export const openNetworkDialog = () => dialog.show({ title: t("切換網路"), body: () => <NetworkForm /> });

/* 連結手機 · 演示 */
function PairingBody() {
  const paired = useDeviceStore((s) => s.settings.paired);
  return (
    <View style={{ gap: 12 }}>
      <DemoNotice>{t("正式產品由手機 App 掃碼綁定。本原型沒有綁定服務，也不產生可掃描的假二維碼。")}</DemoNotice>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 20, paddingTop: 15, paddingBottom: 25 }}>
        <Icon name="smartphone" size={40} color={shell.green} />
        <View style={{ flex: 1 }}>
          <Txt variant="h3">{paired ? t("James 的手機") : t("等待手機連結")}</Txt>
          <Txt muted>{paired ? t("演示裝置 · 已連結") : t("演示配對碼：LT-0826")}</Txt>
        </View>
      </View>
    </View>
  );
}
function PairingFooter() {
  const paired = useDeviceStore((s) => s.settings.paired);
  return (
    <>
      <Button label={t("取消")} onPress={() => dialog.close()} />
      <Button
        variant="primary"
        label={paired ? t("模擬解除連結") : t("模擬手機已確認")}
        onPress={() => {
          const next = !useDeviceStore.getState().settings.paired;
          useDeviceStore.getState().setSettings({ paired: next });
          dialog.close();
          toast(next ? t("演示手機已連結") : t("演示手機已解除連結"));
        }}
      />
    </>
  );
}
export const openPairingDialog = () => dialog.show({ title: t("連結手機 · 演示"), body: () => <PairingBody />, footer: () => <PairingFooter /> });

/* 行程提醒 preview */
export function openReminderPreview() {
  const state = useDeviceStore.getState();
  const event = todaysEvents(state.events)[0];
  const who = memberById(event?.memberId, state.members).name;
  dialog.show({
    title: t("行程提醒"),
    body: (
      <View style={{ gap: 12 }}>
        <DemoNotice>{t("提醒樣式預覽")}</DemoNotice>
        <Txt variant="h2">{t(event?.title || "一起吃晚餐")}</Txt>
        <Txt>{`${event ? (!event.time ? t("全天") : event.time) : "18:30"} · ${who}`}</Txt>
      </View>
    ),
    footer: (
      <>
        <Button
          label={t("稍後提醒")}
          onPress={() => {
            dialog.close();
            toast(t("已演示延後 5 分鐘，不會建立真實提醒"));
          }}
        />
        <Button variant="primary" label={t("知道了")} onPress={() => dialog.close()} />
      </>
    ),
  });
}

/* 家庭同步 (sync-device) */
export function openSyncDialog() {
  const s = useDeviceStore.getState();
  dialog.show({
    title: t("家庭同步"),
    body: (
      <View style={{ gap: 12 }}>
        <DemoNotice>{t("本地互動原型，尚未連接家庭服務。")}</DemoNotice>
        <Txt>{t("{events} 個行程 · {tasks} 個家庭任務 · {photos} 張照片", { events: s.events.length, tasks: s.tasks.length, photos: s.photoCount || 3 })}</Txt>
        <Txt muted>{s.settings.synced ? t("已同步") : t("未同步")}</Txt>
      </View>
    ),
    footer: (
      <>
        <Button label={t("取消")} onPress={() => dialog.close()} />
        <Button
          variant="primary"
          icon="cloud-check"
          label={s.settings.synced ? t("重新同步") : t("立即同步")}
          onPress={() => {
            useDeviceStore.getState().setSettings({ synced: true });
            dialog.close();
            toast(t("已同步"));
          }}
        />
      </>
    ),
  });
}

/* 恢復 DHCP */
export function openDhcpDialog() {
  dialog.show({
    title: t("恢復 DHCP"),
    body: (
      <View style={{ gap: 12 }}>
        <DemoNotice>{t("網路設定演示，不會修改實際設備。")}</DemoNotice>
        <Txt>{t("使用自動取得 IP 的方式重新連線？")}</Txt>
      </View>
    ),
    footer: (
      <>
        <Button label={t("取消")} onPress={() => dialog.close()} />
        <Button
          variant="primary"
          label={t("確認恢復")}
          onPress={() => {
            dialog.close();
            toast(t("已演示恢復 DHCP，自動配置 IP"));
          }}
        />
      </>
    ),
  });
}

/* 離線食譜包 · 演示 */
export function openDownloadDialog() {
  dialog.show({
    title: t("離線食譜包 · 演示"),
    body: (
      <View style={{ gap: 12 }}>
        <DemoNotice>{t("離線下載流程預覽，不會下載真實安裝包。")}</DemoNotice>
        <Txt>{t("12 道食譜 · 86 MB")}</Txt>
      </View>
    ),
    footer: (
      <>
        <Button label={t("取消")} onPress={() => dialog.close()} />
        <Button
          variant="primary"
          label={t("模擬下載完成")}
          onPress={() => {
            useDeviceStore.getState().setSettings({ offlineDownloaded: true });
            dialog.close();
            toast(t("演示食譜包已就緒"));
          }}
        />
      </>
    ),
  });
}

/* 系統更新 · 演示 (check) */
export function openSystemUpdateDialog() {
  const { version, updateAvailable } = useDeviceStore.getState().settings;
  dialog.show({
    title: t("系統更新 · 演示"),
    body: (
      <View style={{ gap: 12 }}>
        <DemoNotice>{t("尚未接入 OTA 服務，不會修改設備系統。")}</DemoNotice>
        <Txt variant="h3">{t("目前版本 {version}", { version })}</Txt>
        <Txt>{updateAvailable ? t("演示檢查結果：發現 0.19.0 新版本。") : t("演示檢查結果：已是最新版本。")}</Txt>
      </View>
    ),
    footer: <Button variant="primary" label={t("完成")} onPress={() => dialog.close()} />,
  });
}

/* 安裝更新 · 演示 */
export function openInstallDialog() {
  dialog.show({
    title: t("安裝更新 · 演示"),
    body: (
      <View style={{ gap: 12 }}>
        <DemoNotice>{t("不會下載安裝包，也不會重新啟動或修改真實設備。")}</DemoNotice>
        <Txt variant="h3">Lucky Table OS 0.19.0</Txt>
        <Txt>{t("更新介面與家庭同步穩定性。")}</Txt>
      </View>
    ),
    footer: (
      <>
        <Button label={t("取消")} onPress={() => dialog.close()} />
        <Button
          variant="primary"
          label={t("模擬更新完成")}
          onPress={() => {
            useDeviceStore.getState().setSettings({ version: "0.19.0", updateAvailable: false });
            dialog.close();
            toast(t("已演示系統更新完成，未修改實際系統"));
          }}
        />
      </>
    ),
  });
}

/* 天氣地區 */
function CityForm() {
  const [city, setCity] = useState(() => t(useDeviceStore.getState().settings.city));
  const submit = () => {
    const value = city.trim();
    if (!value) return;
    useDeviceStore.getState().setSettings({ city: value });
    dialog.close();
    toast(t("顯示城市已更新，天氣數值仍為示例"));
  };
  return (
    <View style={{ gap: 16 }}>
      <TextField label={t("城市")} value={city} onChangeText={setCity} maxLength={20} onSubmitEditing={submit} />
      <Button variant="primary" label={t("儲存")} disabled={!city.trim()} onPress={submit} style={{ alignSelf: "flex-start" }} />
    </View>
  );
}
export const openCityDialog = () => dialog.show({ title: t("天氣地區"), body: () => <CityForm /> });

/* 通知權限 · 演示 */
export function openNotificationDialog() {
  dialog.show({
    title: t("通知權限 · 演示"),
    body: <Txt>{t("正式設備需允許系統通知。本原型僅演示權限狀態，不申請瀏覽器通知。")}</Txt>,
    footer: (
      <>
        <Button label={t("取消")} onPress={() => dialog.close()} />
        <Button
          variant="primary"
          label={t("模擬允許")}
          onPress={() => {
            useDeviceStore.getState().setSettings({ notificationPermission: true });
            dialog.close();
            toast(t("演示通知權限已允許"));
          }}
        />
      </>
    ),
  });
}
