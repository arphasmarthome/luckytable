/* "相框設定" dialog (port of renderSettingsDialog) and the remove-photo confirmation. */
import type { ReactNode } from "react";
import { Pressable, View } from "react-native";
import { Button, Icon, Toggle, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { t, useI18n } from "@/i18n";
import { useDeviceStore } from "@/store/device";
import { dialog } from "@/store/dialog";
import { toast } from "@/store/toast";
import { frame as palette, radius } from "@/theme";
import { DEVICE_OPTIONS, WEATHER_ORDER, WEATHER_PRESETS, motionLabel, normalizedEffectType, normalizedWeatherPreset } from "./data";
import { toggleFullscreen } from "./fullscreen";
import { currentPhoto, frame, useFrameStore } from "./store";
import type { EffectType, WeatherPreset } from "./types";
import { pickPhoto } from "./upload";

function Eyebrow({ children }: { children: string }) {
  return (
    <Txt variant="caption" color={palette.coral} weight="700" style={{ letterSpacing: 1 }}>
      {children}
    </Txt>
  );
}

function SectionHead({ title, note, children }: { title: string; note: string; children?: ReactNode }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
      <View style={{ flex: 1, minWidth: 140 }}>
        <Txt variant="control" weight="600" color={palette.ink}>
          {title}
        </Txt>
        <Txt variant="meta" color={palette.inkSoft}>
          {note}
        </Txt>
      </View>
      {children}
    </View>
  );
}

function RadioButton({ icon, label, selected, onPress }: { icon: string; label: string; selected: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => ({
        flexGrow: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        minHeight: 48,
        paddingHorizontal: 14,
        borderRadius: radius.sm,
        borderWidth: 1,
        borderColor: selected ? palette.green : palette.line,
        backgroundColor: selected ? palette.greenSoft : pressed ? palette.surfaceMuted : "#fff",
      })}>
      <Icon name={icon} size={18} color={selected ? palette.green : palette.inkSoft} />
      <Txt variant="control" weight={selected ? "600" : "500"} color={selected ? palette.green : palette.ink}>
        {label}
      </Txt>
    </Pressable>
  );
}

function selectedDevice() {
  return t(useFrameStore.getState().device || "餐桌日曆機");
}

export function SettingsDialogBody() {
  const { t } = useI18n(); // subscribes to locale changes
  const { isPhone } = useBreakpoint();
  const settings = useDeviceStore((s) => s.settings);
  const setSettings = useDeviceStore((s) => s.setSettings);
  const photo = useFrameStore((s) => currentPhoto(s));
  const device = useFrameStore((s) => s.device);
  const effectType = normalizedEffectType(settings.effectType);
  const weatherPreset = normalizedWeatherPreset(settings.weatherPreset);
  const isWeather = effectType === "weather-transition";
  const photoStatus = photo ? `${t(photo.title)}・${photo.motion ? t("{effect}已就緒", { effect: motionLabel(photo.motion) }) : t("尚未生成動態")}` : t("尚未加入照片");
  const divider = { borderTopWidth: 1, borderTopColor: palette.line, paddingTop: 16 } as const;

  return (
    <View style={{ gap: 18 }}>
      <Eyebrow>PHOTO FRAME</Eyebrow>
      <SectionHead title={t("照片")} note={photoStatus}>
        <Button icon="upload" label={t("加入照片")} onPress={() => pickPhoto()} />
      </SectionHead>

      <View style={[divider, { gap: 14 }]}>
        <SectionHead title={t("播放")} note={t(settings.autoPlayMotion ? "AI 動態自動播放" : "只顯示靜態照片")}>
          <Toggle value={settings.autoPlayMotion} onChange={(value) => setSettings({ autoPlayMotion: value })} accessibilityLabel={t("播放")} />
        </SectionHead>
        <View style={{ gap: 10 }}>
          <Txt variant="meta" weight="600" color={palette.inkSoft}>
            {t("一鍵生成預設")}
          </Txt>
          <View accessibilityRole="radiogroup" accessibilityLabel={t("一鍵生成預設")} style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {(["action-extension", "weather-transition"] as EffectType[]).map((value) => (
              <RadioButton key={value} icon={value === "weather-transition" ? "cloud" : "sparkles"} label={t(value === "weather-transition" ? "天氣變化" : "動作延伸")} selected={effectType === value} onPress={() => setSettings({ effectType: value })} />
            ))}
          </View>
          {isWeather ? (
            <View accessibilityRole="radiogroup" accessibilityLabel={t("天氣預設")} style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
              {WEATHER_ORDER.map((value: WeatherPreset) => (
                <RadioButton key={value} icon={WEATHER_PRESETS[value].icon} label={t(WEATHER_PRESETS[value].label)} selected={weatherPreset === value} onPress={() => setSettings({ weatherPreset: value })} />
              ))}
            </View>
          ) : null}
        </View>
      </View>

      <View style={[divider, { gap: 14 }]}>
        <View style={{ gap: 10 }}>
          <Txt variant="control" weight="600" color={palette.ink}>
            {t("顯示裝置")}
          </Txt>
          <View accessibilityRole="radiogroup" accessibilityLabel={t("顯示裝置")} style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
            {DEVICE_OPTIONS.map((name) => (
              <RadioButton key={name} icon="monitor" label={t(name)} selected={device === name} onPress={() => frame.setDevice(name)} />
            ))}
          </View>
        </View>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {[
            { icon: "maximize", label: t("全螢幕"), onPress: () => { dialog.close(); void toggleFullscreen(); } },
            { icon: "send", label: t("顯示這張"), onPress: () => toast(t("已通知{device}顯示「{title}」。", { device: selectedDevice(), title: t(currentPhoto()?.title) })) },
            { icon: "monitor", label: t("播放動態"), disabled: !photo?.motion, onPress: () => { const current = currentPhoto(); if (current?.motion) toast(t("已通知{device}播放「{title}」的 5 秒動態。", { device: selectedDevice(), title: t(current.title) })); } },
            { icon: "trash", label: t("移除照片"), disabled: !photo, danger: true, onPress: () => { if (currentPhoto()) openRemoveDialog(); } },
          ].map((action) => (
            <Button key={action.label} icon={action.icon} label={action.label} disabled={action.disabled} variant={action.danger ? "danger" : "secondary"} onPress={action.onPress} style={{ flexGrow: 1, flexBasis: isPhone ? "45%" : 160 }} />
          ))}
        </View>
        {photo?.motion ? (
          <Button
            variant="text"
            accent={palette.green}
            label={t("保留原圖並移除動態版本")}
            onPress={() => {
              const current = currentPhoto();
              if (!current?.motion) return;
              frame.setMotion(current.id, null);
              toast(t("已回復原圖；原始照片沒有變更。"));
            }}
          />
        ) : null}
      </View>
    </View>
  );
}

export function openSettingsDialog() {
  dialog.show({ title: t("相框設定"), body: () => <SettingsDialogBody /> });
}

function removeSelectedPhoto() {
  const photo = frame.removeSelected();
  if (photo) toast(t("已移除「{title}」。", { title: t(photo.title) }));
}

export function openRemoveDialog() {
  dialog.show({
    title: t("移除這張照片？"),
    body: () => (
      <View style={{ alignItems: "center", gap: 12, paddingVertical: 8 }}>
        <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: palette.dangerSoft }}>
          <Icon name="trash" size={28} color={palette.danger} />
        </View>
        <Txt variant="body" color={palette.inkSoft} align="center">
          {t("原圖與產生的動態版本都會從這台裝置移除。")}
        </Txt>
      </View>
    ),
    footer: () => (
      <>
        <Button label={t("取消")} onPress={dialog.close} />
        <Button variant="danger" icon="trash" label={t("移除照片")} onPress={() => { dialog.close(); removeSelectedPhoto(); }} />
      </>
    ),
  });
}
