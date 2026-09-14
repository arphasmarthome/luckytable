/* Capture: the simulated camera. Each press of Capture reveals the next demo frame and itemizes
 * what it sees; Review hands the tally to the review screen. */
import { useEffect, useMemo } from "react";
import { Image } from "expo-image";
import { Pressable, View } from "react-native";
import { Button, Chip, Icon, Page } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { make, radius, shadow } from "@/theme";
import { MakeHeader, useMakeNav } from "@/features/make/components/MakeHeader";
import { Kicker, MCard, MTxt } from "@/features/make/components/ui";
import { ITEMS, SHOTS } from "@/features/make/data";
import { capturedItems, useMakeStore } from "@/features/make/store";
import { useMakeStrings } from "@/features/make/strings";

const FRIDGE = require("@/assets/images/lucky/tile-fridge.webp");

export default function CaptureScreen() {
  const { t, lang, nm } = useMakeStrings();
  const { isWide, isPhone } = useBreakpoint();
  const nav = useMakeNav();
  const shots = useMakeStore((s) => s.shots);
  const qty = useMakeStore((s) => s.qty);
  const snap = useMakeStore((s) => s.snap);
  const resetCapture = useMakeStore((s) => s.resetCapture);
  useEffect(() => {
    resetCapture();
  }, [resetCapture]);
  const captured = useMemo(() => capturedItems({ shots, qty }, lang), [shots, qty, lang]);
  const last = shots > 0 ? SHOTS[Math.min(shots, SHOTS.length) - 1] : null;

  const viewfinder = (
    <View style={{ flex: isWide ? 1 : undefined, alignSelf: "stretch", aspectRatio: isWide ? undefined : 4 / 3, minHeight: isWide ? 0 : undefined, borderRadius: radius.xl, backgroundColor: "#2a2b29", overflow: "hidden", position: "relative" }}>
      <Image source={FRIDGE} contentFit="cover" style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, opacity: 0.92 }} />
      <View style={{ position: "absolute", top: 18, left: 18, paddingHorizontal: 18, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: "#ffffff22" }}>
        <MTxt variant="meta" color="#fff" style={{ textTransform: "uppercase", letterSpacing: 2 }}>
          {t.cameraFeed}
        </MTxt>
      </View>
      {last
        ? last.boxes.map(([n, left, top, width, height, alt]) => {
            const color = alt ? make.green : make.primary;
            return (
              <View key={n} style={{ position: "absolute", left: left as `${number}%`, top: top as `${number}%`, width: width as `${number}%`, height: height as `${number}%`, borderWidth: 4, borderColor: color, borderRadius: radius.lg, backgroundColor: alt ? "#549b8326" : "#f3834726" }}>
                <View style={{ position: "absolute", left: -4, top: -40, paddingHorizontal: 14, paddingVertical: 5, borderRadius: radius.pill, backgroundColor: color }}>
                  <MTxt variant="meta" weight="600" color="#fff" numberOfLines={1}>
                    {nm(n, ITEMS[n]?.zh)}
                  </MTxt>
                </View>
              </View>
            );
          })
        : null}
    </View>
  );

  const aside = (
    <View style={{ width: isWide ? 380 : undefined, gap: 18, alignSelf: "stretch" }}>
      <MCard style={isWide ? { flex: 1, minHeight: 0 } : undefined}>
        <Kicker>{t.detectedSoFar}</Kicker>
        {captured.length ? (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
            {captured.map((c) => (
              <Chip key={c.name} label={c.label} count={`×${c.qty}`} soft accent={make.primaryPressed} />
            ))}
          </View>
        ) : (
          <MTxt muted>{t.nothingYet}</MTxt>
        )}
      </MCard>
      <Pressable accessibilityRole="button" accessibilityLabel={t.capture} onPress={snap} style={({ pressed }) => [{ alignSelf: "center", width: 140, height: 140, borderRadius: 70, borderWidth: 8, borderColor: make.warmSoft, backgroundColor: pressed ? make.primaryHover : make.primary, alignItems: "center", justifyContent: "center", gap: 4 }, shadow]}>
        <Icon name="camera" size={38} color="#fff" />
        <MTxt variant="card" weight="700" color="#fff">
          {t.capture}
        </MTxt>
      </Pressable>
      <MTxt muted align="center">
        {t.hintHome}
      </MTxt>
      {isWide ? <View style={{ flex: 1 }} /> : null}
      <Button size="lg" variant="primary" accent={make.green} disabled={!captured.length} label={captured.length ? `${t.review} ${captured.length} ${t.items}` : t.reviewNone} onPress={() => nav.go("/make/review")} />
    </View>
  );

  return (
    <Page background={make.background} gap={16} scroll={!isWide}>
      <MakeHeader title={t.titles.capture} />
      <View style={{ flex: isWide ? 1 : undefined, minHeight: 0, flexDirection: isWide ? "row" : "column", gap: isPhone ? 18 : 24, alignItems: isWide ? "stretch" : undefined }}>
        {viewfinder}
        {aside}
      </View>
    </Page>
  );
}
