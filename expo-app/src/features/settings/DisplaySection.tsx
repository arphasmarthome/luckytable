/* Settings → 顯示與語言 (brightness · language · units · weather city). */
import { View } from "react-native";
import { Button, Segmented, Select } from "@/components/ui";
import { useI18n } from "@/i18n";
import { useDeviceStore, type Settings } from "@/store/device";
import { toast } from "@/store/toast";
import { BrightnessSlider } from "./BrightnessSlider";
import { openCityDialog } from "./dialogs";
import { SectionHeader, SettingsGroup, SettingsRow } from "./SettingsRow";

const DEFAULT_BRIGHTNESS = 85;

export function DisplaySection() {
  const { t, locale, locales, setLocale } = useI18n();
  const settings = useDeviceStore((s) => s.settings);
  const setSettings = useDeviceStore((s) => s.setSettings);
  const unitLabel = (units: Settings["units"]) => (units === "imperial" ? t("英制 · lb / oz") : t("公制 · kg / ml"));
  return (
    <View>
      <SectionHeader title={t("顯示與語言")} />
      <SettingsGroup>
        <SettingsRow
          title={t("畫面亮度")}
          detail={t("螢幕預覽")}
          control={
            <>
              <BrightnessSlider value={settings.brightness} accessibilityLabel={t("畫面亮度")} onChange={(brightness) => setSettings({ brightness })} />
              <Button square icon="rotate-ccw" accessibilityLabel={t("恢復亮度")} onPress={() => setSettings({ brightness: DEFAULT_BRIGHTNESS })} />
            </>
          }
        />
        <SettingsRow
          title={t("語言")}
          detail={t("介面語言")}
          control={
            <Select
              accessibilityLabel={t("語言")}
              title={t("語言")}
              value={locale}
              options={locales.map((item) => ({ value: item.code, label: item.label }))}
              onChange={(code) => {
                setLocale(code);
                const label = locales.find((item) => item.code === code)?.label || code;
                toast(t("介面語言已切換為 {language}", { language: label }));
              }}
              style={{ minWidth: 220 }}
            />
          }
        />
        <SettingsRow
          title={t("度量單位")}
          detail={unitLabel(settings.units)}
          control={
            <Segmented<Settings["units"]>
              size="sm"
              accessibilityLabel={t("度量單位")}
              value={settings.units === "imperial" ? "imperial" : "metric"}
              options={[
                { value: "metric", label: "kg / ml" },
                { value: "imperial", label: "lb / oz" },
              ]}
              onChange={(units) => {
                setSettings({ units });
                toast(t("設定已更新 · 本次操作有效"));
              }}
            />
          }
        />
        <SettingsRow
          title={t("溫度單位")}
          detail={settings.tempUnit === "F" ? t("華氏 · °F") : t("攝氏 · °C")}
          control={
            <Segmented<Settings["tempUnit"]>
              size="sm"
              accessibilityLabel={t("溫度單位")}
              value={settings.tempUnit}
              options={[
                { value: "C", label: "°C" },
                { value: "F", label: "°F" },
              ]}
              onChange={(tempUnit) => {
                setSettings({ tempUnit });
                toast(t("設定已更新 · 本次操作有效"));
              }}
            />
          }
        />
        <SettingsRow title={t("天氣地區")} detail={t(settings.city)} control={<Button icon="map-pin" label={t("變更城市")} onPress={openCityDialog} />} />
      </SettingsGroup>
    </View>
  );
}
