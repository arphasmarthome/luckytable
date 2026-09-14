/* 相框 — family photo frame (port of prototype/photo-frame). Renders inside the app shell:
 * the photo fills the whole content area (Skylight-style) with the caption, navigation, a small
 * control cluster and a thumbnail strip overlaid; AI / settings open dialogs. */
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Modal, Platform, Pressable, View } from "react-native";
import { Button, Icon, Page, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { useI18n } from "@/i18n";
import { useDeviceStore } from "@/store/device";
import { dialog } from "@/store/dialog";
import { frame as palette, radius } from "@/theme";
import { openAiDialog } from "./AiDialog";
import { imageSource } from "./data";
import { exitFullscreen, toggleFullscreen, useFullscreenSync } from "./fullscreen";
import { PhotoStage, RoundButton } from "./PhotoStage";
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

export function PhotoFrameScreen() {
  const { t } = useI18n();
  const { isPhone } = useBreakpoint();
  const photos = useFrameStore((s) => s.photos);
  const photo = useFrameStore((s) => currentPhoto(s));
  const cinema = useFrameStore((s) => s.cinema);
  const autoPlay = useDeviceStore((s) => s.settings.autoPlayMotion);
  const setSettings = useDeviceStore((s) => s.setSettings);
  useRouteActions();
  useKeyboard();
  useFullscreenSync();

  const playing = Boolean(photo?.motion && autoPlay);
  const onAi = (photoId: string) => {
    if (useFrameStore.getState().cinema) void exitFullscreen();
    openAiDialog(photoId);
  };

  const toolbar = (
    <>
      <RoundButton icon={autoPlay ? "pause" : "play"} label={autoPlay ? t("暫停") : t("播放")} onPress={() => setSettings({ autoPlayMotion: !autoPlay })} />
      <RoundButton icon="maximize" label={t("全螢幕")} onPress={() => void toggleFullscreen()} disabled={!photo} />
      <RoundButton icon="settings" label={t("設定")} onPress={openSettingsDialog} />
    </>
  );

  const thumbs = photos.length > 1 ? (
    <View style={{ flexDirection: "row", gap: 6, padding: 6, borderRadius: radius.md, backgroundColor: "rgba(17,25,22,0.45)" }}>
      {photos.map((item) => {
        const selected = item.id === photo?.id;
        return (
          <Pressable
            key={item.id}
            accessibilityRole="button"
            accessibilityLabel={t(item.title)}
            accessibilityState={{ selected }}
            onPress={() => frame.selectPhoto(item.id)}
            style={({ pressed }) => ({ width: isPhone ? 44 : 60, height: isPhone ? 30 : 40, borderRadius: 6, overflow: "hidden", borderWidth: 2, borderColor: selected ? "#fff" : "transparent", opacity: pressed ? 0.8 : selected ? 1 : 0.7, backgroundColor: palette.surfaceMuted })}>
            <Image source={imageSource(item.src)} contentFit="cover" style={{ width: "100%", height: "100%" }} />
            {item.motion ? (
              <View style={{ position: "absolute", right: 2, bottom: 2, width: 14, height: 14, borderRadius: 7, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(18,107,85,0.9)" }}>
                <Icon name="sparkles" size={9} color="#fff" strokeWidth={2.4} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  ) : null;

  return (
    <Page background="#0d0f0e" scroll={false} padded={false} gap={0}>
      {cinema ? (
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <Txt variant="meta" color="rgba(255,255,255,0.7)">
            {t("全螢幕")}
          </Txt>
        </View>
      ) : (
        <PhotoStage fill photo={photo} playing={playing} toolbar={toolbar} footer={thumbs} onPrevious={() => frame.changePhoto(-1)} onNext={() => frame.changePhoto(1)} onAi={onAi} />
      )}
      {!photos.length ? <Button icon="settings" label={t("請到設定加入照片")} onPress={openSettingsDialog} accent={palette.green} style={{ position: "absolute", bottom: 24, alignSelf: "center" }} /> : null}

      <Modal visible={cinema} animationType="fade" onRequestClose={() => void exitFullscreen()} statusBarTranslucent supportedOrientations={["portrait", "landscape"]}>
        <View style={{ flex: 1, backgroundColor: "#0d0f0e" }}>
          <PhotoStage photo={photo} playing={playing} cinema onPrevious={() => frame.changePhoto(-1)} onNext={() => frame.changePhoto(1)} onAi={onAi} onExitCinema={() => void exitFullscreen()} />
        </View>
      </Modal>
    </Page>
  );
}
