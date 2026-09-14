/* 相框 — family photo frame (port of prototype/photo-frame). Renders inside the app shell:
 * eyebrow heading, the photo stage, a toolbar, thumbnail navigation and the AI / settings dialogs. */
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Modal, Platform, Pressable, ScrollView, View } from "react-native";
import { Button, Icon, Page, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { useDeviceStore } from "@/store/device";
import { dialog } from "@/store/dialog";
import { frame as palette, radius, shadow } from "@/theme";
import { openAiDialog } from "./AiDialog";
import { MOTION_SECONDS, imageSource, motionLabel } from "./data";
import { exitFullscreen, toggleFullscreen, useFullscreenSync } from "./fullscreen";
import { PhotoStage } from "./PhotoStage";
import { openSettingsDialog } from "./SettingsDialog";
import { currentPhoto, frame, useFrameStore } from "./store";

type Params = { action?: string | string[]; photoId?: string | string[] };
const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) || "";

/** Route params play the role of the prototype's device-bridge `activate` message. */
function useRouteActions() {
  const params = useLocalSearchParams<Params>();
  const router = useRouter();
  const action = first(params.action);
  const photoId = first(params.photoId);
  const handled = useRef("");
  useEffect(() => {
    const key = `${action}|${photoId}`;
    if (!action && !photoId) {
      handled.current = "";
      return;
    }
    if (handled.current === key) return;
    handled.current = key;
    if (photoId) frame.selectPhoto(photoId);
    if (action === "settings" || action === "upload") openSettingsDialog();
    if (action === "fullscreen") {
      dialog.close();
      void toggleFullscreen();
    }
    router.replace("/photo-frame");
  }, [action, photoId, router]);
}

/** Arrow keys change photos; Escape leaves the cinema fallback (web only). */
function useKeyboard() {
  useEffect(() => {
    if (Platform.OS !== "web" || typeof window === "undefined") return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target && target.matches?.("input, select, textarea, [contenteditable]")) return;
      if (dialog.isOpen()) return;
      if (event.key === "ArrowLeft") frame.changePhoto(-1);
      if (event.key === "ArrowRight") frame.changePhoto(1);
      if (event.key === "Escape" && useFrameStore.getState().cinema) void exitFullscreen();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}

function ToolbarButton({ icon, label, onPress, disabled, active }: { icon: string; label: string; onPress: () => void; disabled?: boolean; active?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled), selected: Boolean(active) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => ({
        width: 44,
        height: 44,
        borderRadius: 22,
        alignItems: "center",
        justifyContent: "center",
        borderWidth: 1,
        borderColor: active ? palette.green : palette.line,
        backgroundColor: active ? palette.greenSoft : pressed ? palette.surfaceMuted : palette.surface,
        opacity: disabled ? 0.4 : 1,
      })}>
      <Icon name={icon} size={18} color={active ? palette.green : palette.ink} />
    </Pressable>
  );
}

export function PhotoFrameScreen() {
  const { t } = useI18n();
  const { width, height, isPhone, isWide, inset } = useBreakpoint();
  const photos = useFrameStore((s) => s.photos);
  const photo = useFrameStore((s) => currentPhoto(s));
  const cinema = useFrameStore((s) => s.cinema);
  const autoPlay = useDeviceStore((s) => s.settings.autoPlayMotion);
  const setSettings = useDeviceStore((s) => s.setSettings);
  useRouteActions();
  useKeyboard();
  useFullscreenSync();

  const enhancedCount = photos.filter((item) => item.motion).length;
  const status = photos.length ? t("已同步 {photos} 張照片・{motion} 張 AI 動態", { photos: photos.length, motion: enhancedCount }) : t("目前沒有照片");
  const playing = Boolean(photo?.motion && autoPlay);
  const index = photo ? photos.indexOf(photo) + 1 : 0;
  const motionStatus = photo
    ? photo.motion
      ? `${motionLabel(photo.motion)}・${t("同一張照片 {n} 秒", { n: photo.motion.durationSeconds || MOTION_SECONDS })}${playing ? t("自動播放中") : t("自動播放已關閉")}`
      : t("靜態照片・只會手動切換")
    : t("請到設定加入照片");

  // Wide screens: keep the stage within the viewport so the toolbar stays visible beneath it.
  const contentWidth = width - inset * 2 - (isWide ? 120 : 0);
  const maxByHeight = Math.max(480, (height - 340) * (16 / 9));
  const frameWidth = isPhone ? undefined : Math.min(contentWidth, maxByHeight);

  const onAi = (photoId: string) => {
    if (useFrameStore.getState().cinema) void exitFullscreen();
    openAiDialog(photoId);
  };

  return (
    <Page background={palette.canvas} gap={18}>
      <View style={{ gap: 4 }}>
        <Txt variant="caption" color={palette.coral} weight="700" style={{ letterSpacing: 1.2 }}>
          FAMILY MEMORIES
        </Txt>
        <Txt variant="h1" color={palette.ink}>
          {t("家裡最近的好時刻。")}
        </Txt>
        <Txt variant="body" color={palette.inkSoft} accessibilityLiveRegion="polite">
          {status}
        </Txt>
      </View>

      <View style={[{ width: frameWidth, maxWidth: "100%", alignSelf: isPhone ? "stretch" : "center", backgroundColor: palette.surface, borderWidth: 1, borderColor: palette.line, borderRadius: radius.md, padding: isPhone ? 10 : 16, gap: 12 }, shadow]}>
        {cinema ? (
          <View style={{ aspectRatio: 16 / 9, borderRadius: radius.sm, backgroundColor: palette.surfaceMuted, alignItems: "center", justifyContent: "center" }}>
            <Txt variant="meta" color={palette.inkSoft}>
              {t("全螢幕")}
            </Txt>
          </View>
        ) : (
          <PhotoStage photo={photo} playing={playing} onPrevious={() => frame.changePhoto(-1)} onNext={() => frame.changePhoto(1)} onAi={onAi} />
        )}

        <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 12, minHeight: 48 }}>
          <View style={{ flex: 1, minWidth: 180, gap: 2 }}>
            <Txt variant="control" weight="600" color={palette.ink} numberOfLines={1}>
              {photo ? `${index} / ${photos.length}・${t(photo.title)}` : t("尚未選擇照片")}
            </Txt>
            <Txt variant="meta" color={palette.inkSoft} numberOfLines={2}>
              {motionStatus}
            </Txt>
          </View>
          <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
            <ToolbarButton icon="chevron-left" label={t("上一張照片")} onPress={() => frame.changePhoto(-1)} disabled={!photo} />
            <ToolbarButton icon="chevron-right" label={t("下一張照片")} onPress={() => frame.changePhoto(1)} disabled={!photo} />
            <ToolbarButton icon={autoPlay ? "pause" : "play"} label={autoPlay ? t("暫停") : t("播放")} active={autoPlay} onPress={() => setSettings({ autoPlayMotion: !autoPlay })} />
            <ToolbarButton icon="maximize" label={t("全螢幕")} onPress={() => void toggleFullscreen()} disabled={!photo} />
            <ToolbarButton icon="settings" label={t("設定")} onPress={openSettingsDialog} />
          </View>
        </View>

        {photos.length ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 2 }}>
            {photos.map((item) => {
              const selected = item.id === photo?.id;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={t(item.title)}
                  accessibilityState={{ selected }}
                  onPress={() => frame.selectPhoto(item.id)}
                  style={({ pressed }) => ({ width: 80, height: 52, borderRadius: radius.sm, overflow: "hidden", borderWidth: 2, borderColor: selected ? palette.green : "transparent", opacity: pressed ? 0.8 : selected ? 1 : 0.75, backgroundColor: palette.surfaceMuted })}>
                  <Image source={imageSource(item.src)} contentFit="cover" style={{ width: "100%", height: "100%" }} />
                  {item.motion ? (
                    <View style={{ position: "absolute", right: 3, bottom: 3, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(18,107,85,0.9)" }}>
                      <Icon name="sparkles" size={10} color="#fff" strokeWidth={2.4} />
                    </View>
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>
        ) : null}
      </View>

      {!photos.length ? <Button icon="settings" label={t("請到設定加入照片")} onPress={openSettingsDialog} accent={palette.green} style={{ alignSelf: "flex-start" }} /> : null}

      <Modal visible={cinema} animationType="fade" onRequestClose={() => void exitFullscreen()} statusBarTranslucent supportedOrientations={["portrait", "landscape"]}>
        <View style={{ flex: 1, backgroundColor: "#0d0f0e" }}>
          <PhotoStage photo={photo} playing={playing} cinema onPrevious={() => frame.changePhoto(-1)} onNext={() => frame.changePhoto(1)} onAi={onAi} onExitCinema={() => void exitFullscreen()} />
        </View>
      </Modal>
    </Page>
  );
}
