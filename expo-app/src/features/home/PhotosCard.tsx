/* Home → 最近的回憶: the newest photo from the frame. Tap the photo (or swipe it) to open the
 * photo frame / step through the album; the arrow buttons only step — they sit outside the
 * tap/swipe target so pressing one never also opens the frame. */
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Icon, Txt } from "@/components/ui";
import { imageSource } from "@/features/photo-frame/data";
import { useFrameStore } from "@/features/photo-frame/store";
import { useI18n } from "@/i18n";
import { radius, shell } from "@/theme";
import { HomeCard } from "./HomeCard";

function Arrow({ icon, label, onPress, side }: { icon: string; label: string; onPress: () => void; side: "left" | "right" }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} hitSlop={6} style={({ pressed }) => ({ position: "absolute", top: "50%", marginTop: -18, [side]: 10, width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: pressed ? "rgba(17,25,22,0.7)" : "rgba(17,25,22,0.45)", borderWidth: 1, borderColor: "rgba(255,255,255,0.45)" })}>
      <Icon name={icon} size={18} color="#fff" strokeWidth={2.2} />
    </Pressable>
  );
}

export function PhotosCard() {
  const router = useRouter();
  const { t } = useI18n();
  const photos = useFrameStore((s) => s.photos);
  const [index, setIndex] = useState(0);
  const count = photos.length;
  const current = count ? photos[((index % count) + count) % count] : null;
  const step = (direction: 1 | -1) => {
    if (count) setIndex((i) => (i + direction + count) % count);
  };
  const open = () => router.navigate((current ? `/photo-frame?photoId=${current.id}` : "/photo-frame") as never);

  const pan = Gesture.Pan()
    .runOnJS(true)
    .activeOffsetX([-16, 16])
    .failOffsetY([-12, 12])
    .onEnd((e) => {
      if (e.translationX <= -40) step(1);
      else if (e.translationX >= 40) step(-1);
    });

  return (
    <HomeCard title={t("最近的回憶")} aside={current ? <Txt variant="meta" muted>{t("第 {n} 張照片", { n: (((index % count) + count) % count) + 1 })} / {count}</Txt> : undefined} style={{ flex: 1 }}>
      {current ? (
        <View style={{ flex: 1, minHeight: 140, borderRadius: radius.md, overflow: "hidden", backgroundColor: "#edf1ee" }}>
          <GestureDetector gesture={pan}>
            <Pressable accessibilityRole="button" accessibilityLabel={t("開啟相框")} onPress={open} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}>
              <Image source={imageSource(current.src)} contentFit="cover" transition={200} style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }} accessibilityLabel={t(current.title)} />
              <View pointerEvents="none" style={{ position: "absolute", left: 0, right: 0, bottom: 0, paddingHorizontal: 14, paddingVertical: 10, backgroundColor: "rgba(12,20,17,0.55)" }}>
                <Txt variant="control" weight="600" color="#fff" numberOfLines={1}>
                  {t(current.title)}
                </Txt>
                <Txt variant="caption" color="rgba(255,255,255,0.8)" numberOfLines={1}>
                  {t(current.capturedAt)}・{t(current.owner)}
                </Txt>
              </View>
            </Pressable>
          </GestureDetector>
          {count > 1 ? (
            <>
              <Arrow icon="chevron-left" label={t("上一張照片")} side="left" onPress={() => step(-1)} />
              <Arrow icon="chevron-right" label={t("下一張照片")} side="right" onPress={() => step(1)} />
              <View pointerEvents="none" style={{ position: "absolute", top: 10, right: 12, flexDirection: "row", gap: 5 }}>
                {photos.map((p, i) => (
                  <View key={p.id} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: i === ((index % count) + count) % count ? "#fff" : "rgba(255,255,255,0.45)" }} />
                ))}
              </View>
            </>
          ) : null}
        </View>
      ) : (
        <Pressable accessibilityRole="button" onPress={open} style={{ flex: 1, minHeight: 140, alignItems: "center", justifyContent: "center", gap: 8, borderRadius: radius.md, backgroundColor: shell.surfaceMuted }}>
          <Icon name="images" size={32} color={shell.muted} />
          <Txt variant="meta" muted>
            {t("請到設定加入照片")}
          </Txt>
        </Pressable>
      )}
    </HomeCard>
  );
}
