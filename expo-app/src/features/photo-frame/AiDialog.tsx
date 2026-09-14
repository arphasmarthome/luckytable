/* "AI 美化照片" dialog (port of renderAiDialog): processing → complete / error with retry. */
import { Image } from "expo-image";
import { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { Button, Icon, Txt } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { t, useI18n } from "@/i18n";
import { dialog } from "@/store/dialog";
import { frame as palette, radius } from "@/theme";
import { PROCESSING_PHASES, aiEndpoint, beginAi, cancelAi, startAiGeneration } from "./ai";
import { MOTION_SECONDS, imageSource, motionIcon, motionLabel, normalizedEffectType } from "./data";
import { ScanLine, type Size } from "./MotionDemo";
import { StageMedia } from "./PhotoStage";
import { photoById, useFrameStore } from "./store";

function Eyebrow({ children }: { children: string }) {
  return (
    <Txt variant="caption" color={palette.coral} weight="700" style={{ letterSpacing: 1 }}>
      {children}
    </Txt>
  );
}

function useSize(): [Size, (event: LayoutChangeEvent) => void] {
  const [size, setSize] = useState<Size>({ width: 0, height: 0 });
  return [
    size,
    (event) => {
      const { width, height } = event.nativeEvent.layout;
      if (Math.abs(width - size.width) > 1 || Math.abs(height - size.height) > 1) setSize({ width, height });
    },
  ];
}

export function AiDialogBody() {
  const { t } = useI18n(); // subscribes to locale changes
  const { isPhone } = useBreakpoint();
  const ai = useFrameStore((s) => s.ai);
  const photo = useFrameStore((s) => photoById(s.ai?.photoId, s));
  const [size, onLayout] = useSize();
  if (!ai || !photo) return null;

  if (ai.phase === "processing") {
    const isWeather = normalizedEffectType(ai.effectType) === "weather-transition";
    const phases = isWeather ? PROCESSING_PHASES.weather : PROCESSING_PHASES.action;
    const percent = Math.round(ai.progress);
    return (
      <View style={{ gap: 18 }} accessibilityState={{ busy: true }}>
        <Eyebrow>AI MOTION PHOTO</Eyebrow>
        <View style={{ flexDirection: isPhone ? "column" : "row", gap: 20 }}>
          <View onLayout={onLayout} style={{ width: isPhone ? "100%" : 280, aspectRatio: 4 / 3, borderRadius: radius.md, overflow: "hidden", backgroundColor: "#1a2320" }}>
            <Image source={imageSource(photo.src)} contentFit="cover" style={{ width: "100%", height: "100%" }} />
            {size.height ? <ScanLine height={size.height} /> : null}
          </View>
          <View style={{ flex: 1, gap: 12, minWidth: 0 }}>
            <View style={{ flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
              <Txt variant="h3" color={palette.ink} style={{ flexShrink: 1 }}>
                {t(phases[ai.currentStep] || phases[0])}
              </Txt>
              <Txt variant="h3" color={palette.green}>
                {percent}%
              </Txt>
            </View>
            <View accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: percent }} style={{ height: 8, borderRadius: 4, backgroundColor: palette.surfaceMuted, overflow: "hidden" }}>
              <View style={{ width: `${Math.max(0, Math.min(100, ai.progress))}%`, height: "100%", backgroundColor: palette.green }} />
            </View>
            <View style={{ gap: 8 }}>
              {phases.map((label, index) => {
                const done = index < ai.currentStep;
                const active = index === ai.currentStep;
                return (
                  <View key={label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Icon name={done ? "circle-check" : active ? "loader-circle" : "circle"} size={18} color={done || active ? palette.green : palette.line} />
                    <Txt variant="body" color={done || active ? palette.ink : palette.inkSoft} weight={active ? "600" : "400"}>
                      {t(label)}
                    </Txt>
                  </View>
                );
              })}
            </View>
            <Txt variant="caption" color={palette.inkSoft}>
              {t(aiEndpoint() ? "家庭 AI 服務" : "本機示範模式")}
            </Txt>
          </View>
        </View>
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <Button label={t("取消處理")} onPress={dialog.close} />
        </View>
      </View>
    );
  }

  if (ai.phase === "complete" && ai.result) {
    const result = ai.result;
    const resultLabel = motionLabel(result);
    return (
      <View style={{ gap: 16 }}>
        <Eyebrow>AI MOTION PHOTO</Eyebrow>
        <View onLayout={onLayout} style={{ width: "100%", aspectRatio: 16 / 9, borderRadius: radius.md, overflow: "hidden", backgroundColor: "#cec7bc" }}>
          <StageMedia photo={photo} motion={result} playing size={size} />
          <View style={{ position: "absolute", left: 12, top: 12, flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radius.pill, backgroundColor: "rgba(18,107,85,0.84)", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)" }}>
            <Icon name={motionIcon(result)} size={13} color="#fff" strokeWidth={2.2} />
            <Txt variant="caption" color="#fff" weight="700">
              {resultLabel}・{t("{n} 秒", { n: result.durationSeconds || MOTION_SECONDS })}
            </Txt>
          </View>
          {result.kind === "demo" ? (
            <View style={{ position: "absolute", right: 12, bottom: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.pill, backgroundColor: "rgba(12,20,17,0.6)" }}>
              <Txt variant="caption" color="#fff">
                {t("本機示範效果")}
              </Txt>
            </View>
          ) : null}
        </View>
        <Txt variant="h3" color={palette.ink}>
          {t("{effect}已加入相框", { effect: resultLabel })}
        </Txt>
        <Txt variant="body" color={palette.inkSoft}>
          {t("同一張照片會播放 5 秒畫面內動態，不會自動切換到下一張。")}
        </Txt>
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
          {[
            ["畫面主體", result.analysis.subject],
            ["場景分析", result.analysis.depth],
            ["動態方式", result.analysis.motion],
          ].map(([label, value]) => (
            <View key={label} style={{ flexGrow: 1, flexBasis: isPhone ? "100%" : 150, gap: 2, padding: 14, borderRadius: radius.md, backgroundColor: palette.surfaceMuted }}>
              <Txt variant="caption" color={palette.inkSoft}>
                {t(label)}
              </Txt>
              <Txt variant="control" color={palette.ink} weight="600">
                {t(value)}
              </Txt>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: "row", justifyContent: "flex-end" }}>
          <Button variant="primary" accent={palette.greenDeep} icon="check" label={t("完成")} onPress={dialog.close} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ gap: 14, alignItems: "center", paddingVertical: 8 }}>
      <View style={{ width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", backgroundColor: palette.dangerSoft }}>
        <Icon name="circle-alert" size={30} color={palette.danger} />
      </View>
      <Txt variant="h3" color={palette.ink} align="center">
        {t("這次沒有產生成功")}
      </Txt>
      <Txt variant="body" color={palette.inkSoft} align="center">
        {t(ai.error || "家庭 AI 服務暫時無法使用，原圖沒有變更。")}
      </Txt>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 10, marginTop: 6 }}>
        <Button label={t("保留原圖")} onPress={dialog.close} />
        <Button variant="primary" accent={palette.greenDeep} icon="rotate-ccw" label={t("重新嘗試")} onPress={() => void startAiGeneration()} />
      </View>
    </View>
  );
}

/** One-tap AI motion for a photo: opens the dialog and starts generation immediately. */
export function openAiDialog(photoId: string) {
  const photo = beginAi(photoId);
  if (!photo) return;
  dialog.show({ title: t("AI 美化照片"), body: () => <AiDialogBody />, onClose: cancelAi });
  void startAiGeneration();
}
