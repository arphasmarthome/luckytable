/* The photo stage (port of renderStage / stageMedia): blurred backdrop, contained photo, the demo
 * motion layer, caption with AI badge, prev / next controls, the corner AI button and the playback bar. */
import { Image } from "expo-image";
import { createElement, useState } from "react";
import { Platform, Pressable, StyleSheet, View, type LayoutChangeEvent } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { Icon, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { t, useI18n } from "@/i18n";
import { frame as palette, radius } from "@/theme";
import { MOTION_SECONDS, imageSource, motionIcon, motionLabel } from "./data";
import { DemoEffect, PlaybackProgress, type Size } from "./MotionDemo";
import type { Motion, Photo, PhotoSource } from "./types";

export type PhotoStageProps = {
  photo: Photo | null;
  playing: boolean;
  /** Edge-to-edge presentation (browser fullscreen or the cinema fallback). */
  cinema?: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onAi: (photoId: string) => void;
  onExitCinema?: () => void;
};

/** Generated clip from the AI endpoint: a <video> on web, the poster elsewhere. */
function ServerVideo({ motion, poster, playing }: { motion: Motion; poster: PhotoSource; playing: boolean }) {
  if (Platform.OS === "web") {
    const posterUri = typeof poster === "string" ? poster : undefined;
    return createElement("video", {
      src: motion.videoUrl,
      poster: posterUri,
      muted: true,
      loop: true,
      playsInline: true,
      autoPlay: playing,
      style: { position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain", background: "#111" },
    });
  }
  return <Image source={imageSource(poster)} contentFit="contain" style={StyleSheet.absoluteFill} />;
}

function Shade() {
  return (
    <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "43%" }}>
      <Svg width="100%" height="100%">
        <Defs>
          <LinearGradient id="stageShade" x1="0" y1="1" x2="0" y2="0">
            <Stop offset="0" stopColor="#0c1411" stopOpacity="0.68" />
            <Stop offset="1" stopColor="#0c1411" stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#stageShade)" />
      </Svg>
    </View>
  );
}

/** Media layers for a photo (also used by the AI result preview). */
export function StageMedia({ photo, motion, playing, size, backdrop = true }: { photo: Photo; motion: Motion | null; playing: boolean; size: Size; backdrop?: boolean }) {
  const source = imageSource(photo.src);
  return (
    <>
      {backdrop ? <Image source={source} contentFit="cover" blurRadius={24} style={[StyleSheet.absoluteFill, { opacity: 0.62, transform: [{ scale: 1.12 }] }]} /> : null}
      {motion?.kind === "server" && motion.videoUrl ? (
        <ServerVideo motion={motion} poster={motion.posterUrl || photo.src} playing={playing} />
      ) : (
        <>
          <Image source={source} contentFit="contain" style={StyleSheet.absoluteFill} accessibilityLabel={t(photo.title)} />
          {motion?.kind === "demo" && size.width > 0 ? <DemoEffect src={photo.src} motion={motion} playing={playing} size={size} /> : null}
        </>
      )}
    </>
  );
}

function RoundButton({ icon, label, onPress, disabled, style, light }: { icon: string; label: string; onPress?: () => void; disabled?: boolean; style?: object; light?: boolean }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [
        {
          width: 44,
          height: 44,
          borderRadius: 22,
          alignItems: "center",
          justifyContent: "center",
          borderWidth: 1,
          borderColor: light ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.42)",
          backgroundColor: light ? (pressed ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.72)") : pressed ? "rgba(17,25,22,0.68)" : "rgba(17,25,22,0.44)",
          opacity: disabled ? 0.35 : 1,
        },
        style,
      ]}>
      <Icon name={icon} size={light ? 18 : 20} color={light ? palette.green : "#fff"} strokeWidth={2} />
    </Pressable>
  );
}

export function PhotoStage({ photo, playing, cinema = false, onPrevious, onNext, onAi, onExitCinema }: PhotoStageProps) {
  const { t } = useI18n(); // subscribes to locale changes
  const { isPhone } = useBreakpoint();
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    if (Math.abs(width - size.width) > 1 || Math.abs(height - size.height) > 1) setSize({ width, height });
  };
  const edge = cinema ? (isPhone ? 20 : 48) : isPhone ? 14 : 20;
  const aiLabel = photo?.motion ? t("一鍵更新 AI 動態") : t("一鍵生成 AI 動態");

  if (!photo) {
    return (
      <View style={[styles.stage, { backgroundColor: palette.surfaceMuted, minHeight: isPhone ? 240 : 320, alignItems: "center", justifyContent: "center", padding: 24, gap: 8 }]}>
        <Icon name="images" size={46} color={palette.green} strokeWidth={1.6} />
        <Txt variant="h2" color={palette.ink} align="center">
          {t("相簿還是空的")}
        </Txt>
        <Txt variant="body" color={palette.inkSoft} align="center">
          {t("從手機或這台裝置加入第一張照片。")}
        </Txt>
        <RoundButton light icon="wand-sparkles" label={aiLabel} disabled style={{ position: "absolute", top: 14, right: 14 }} />
      </View>
    );
  }

  const motion = photo.motion;
  return (
    <View onLayout={onLayout} style={[styles.stage, cinema ? styles.cinema : { aspectRatio: 16 / 9, minHeight: isPhone ? 200 : 320 }]}>
      <StageMedia photo={photo} motion={motion} playing={playing} size={size} />
      <Shade />
      <View pointerEvents="none" style={{ position: "absolute", left: edge, right: edge + 100, bottom: edge, gap: 4 }}>
        {motion ? (
          <View style={{ alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", backgroundColor: "rgba(18,107,85,0.84)", marginBottom: 2 }}>
            <Icon name={motionIcon(motion)} size={13} color="#fff" strokeWidth={2.2} />
            <Txt variant="caption" color="#fff" weight="700">
              {motionLabel(motion)}・{t("{n} 秒", { n: motion.durationSeconds || MOTION_SECONDS })}
            </Txt>
          </View>
        ) : null}
        <Txt variant="meta" color="rgba(255,255,255,0.78)" weight="600">
          {t(photo.capturedAt)}・{t(photo.owner)}
        </Txt>
        <Txt variant={cinema ? "h1" : isPhone ? "h3" : "section"} color="#fff" numberOfLines={1}>
          {t(photo.title)}
        </Txt>
      </View>
      <View style={{ position: "absolute", right: edge, bottom: edge, flexDirection: "row", gap: 7 }}>
        <RoundButton icon="chevron-left" label={t("上一張照片")} onPress={onPrevious} />
        <RoundButton icon="chevron-right" label={t("下一張照片")} onPress={onNext} />
      </View>
      <RoundButton light icon="wand-sparkles" label={aiLabel} onPress={() => onAi(photo.id)} style={{ position: "absolute", top: cinema ? edge : 14, right: cinema ? edge : 14 }} />
      {cinema && onExitCinema ? <RoundButton icon="minimize" label={t("離開全螢幕")} onPress={onExitCinema} style={{ position: "absolute", top: edge, left: edge }} /> : null}
      {motion ? <PlaybackProgress playing={playing} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stage: { position: "relative", width: "100%", overflow: "hidden", borderRadius: radius.sm, backgroundColor: "#cec7bc" },
  cinema: { flex: 1, borderRadius: 0, backgroundColor: "#0d0f0e" },
});
