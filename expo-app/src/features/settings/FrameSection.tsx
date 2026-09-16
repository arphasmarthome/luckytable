/* Settings → 相框 (photo frame preferences; the frame module owns the photos themselves). */
import { useRouter } from "expo-router";
import { View } from "react-native";
import { Button, Select, Toggle } from "@/components/ui";
import { useI18n } from "@/i18n";
import { useDeviceStore, type Settings } from "@/store/device";
import { toast } from "@/store/toast";
import { RangeSlider } from "./RangeSlider";
import { SectionHeader, SettingsGroup, SettingsRow } from "./SettingsRow";

const WEATHER_PRESETS: [Settings["weatherPreset"], string][] = [
  ["sunlight", "晴日暖光"],
  ["clouds", "流雲變化"],
  ["rain", "柔和細雨"],
  ["snow", "輕柔飄雪"],
];

export function FrameSection() {
  const router = useRouter();
  const { t } = useI18n();
  const settings = useDeviceStore((s) => s.settings);
  const setSettings = useDeviceStore((s) => s.setSettings);
  const photoCount = useDeviceStore((s) => s.photoCount);
  const motionCount = useDeviceStore((s) => s.motionCount);
  const updated = () => toast(t("設定已更新 · 本次操作有效"));
  return (
    <View>
      <SectionHeader title={t("相框")} />
      <SettingsGroup>
        <SettingsRow title={t("照片管理")} detail={t("{photos} 張照片 · {motion} 張 AI 動態", { photos: photoCount ?? 7, motion: motionCount || 0 })} control={<Button icon="images" label={t("管理照片")} onPress={() => router.navigate("/photo-frame?action=settings" as never)} />} />
        <SettingsRow
          title={t("自動播放 AI 動態")}
          detail={t("同張照片內的 5 秒動作或天氣變化")}
          control={
            <Toggle
              value={settings.autoPlayMotion}
              accessibilityLabel={t("自動播放 AI 動態")}
              onChange={(autoPlayMotion) => {
                setSettings({ autoPlayMotion });
                updated();
              }}
            />
          }
        />
        <SettingsRow
          title={t("投影片秒數")}
          detail={t("切換到下一張照片前的停留時間")}
          control={
            <RangeSlider
              value={settings.slideshowSeconds}
              onChange={(slideshowSeconds) => {
                setSettings({ slideshowSeconds });
                updated();
              }}
              min={3}
              max={30}
              step={1}
              trackWidth={200}
              accessibilityLabel={t("投影片秒數")}
              format={(v) => t("{n} 秒", { n: v })}
            />
          }
        />
        <SettingsRow
          title={t("預設動態方式")}
          detail={t("下次產生時使用")}
          control={
            <Select<Settings["effectType"]>
              accessibilityLabel={t("預設動態方式")}
              title={t("預設動態方式")}
              value={settings.effectType}
              options={[
                { value: "action-extension", label: t("動作延伸") },
                { value: "weather-transition", label: t("天氣變化") },
              ]}
              onChange={(effectType) => {
                setSettings({ effectType });
                updated();
              }}
              style={{ minWidth: 220 }}
            />
          }
        />
        {settings.effectType === "weather-transition" ? (
          <SettingsRow
            title={t("天氣效果")}
            detail={t("下次產生時使用")}
            control={
              <Select<Settings["weatherPreset"]>
                accessibilityLabel={t("天氣效果")}
                title={t("天氣效果")}
                value={settings.weatherPreset}
                options={WEATHER_PRESETS.map(([value, label]) => ({ value, label: t(label) }))}
                onChange={(weatherPreset) => {
                  setSettings({ weatherPreset });
                  updated();
                }}
                style={{ minWidth: 220 }}
              />
            }
          />
        ) : null}
      </SettingsGroup>
    </View>
  );
}
