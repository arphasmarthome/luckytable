/* Review: check the quantities of what the camera found, then add to stock or match directly. */
import { useMemo } from "react";
import { ScrollView, View } from "react-native";
import { Button, Page } from "@/components/ui";
import { useBreakpoint } from "@/hooks/use-breakpoint";
import { make } from "@/theme";
import { MakeHeader, useMakeNav } from "@/features/make/components/MakeHeader";
import { Grid, MCard, MTxt, Photo, Stepper, Tag } from "@/features/make/components/ui";
import { capturedItems, useMakeStore } from "@/features/make/store";
import { useMakeStrings } from "@/features/make/strings";

export default function ReviewScreen() {
  const { t, lang } = useMakeStrings();
  const { isPhone, isDesktop, isWide } = useBreakpoint();
  const nav = useMakeNav();
  const shots = useMakeStore((s) => s.shots);
  const qty = useMakeStore((s) => s.qty);
  const setQty = useMakeStore((s) => s.setQty);
  const addCapturedToStock = useMakeStore((s) => s.addCapturedToStock);
  const captured = useMemo(() => capturedItems({ shots, qty }, lang), [shots, qty, lang]);
  const units = captured.reduce((a, c) => a + c.qty, 0);
  const grid = (
      <Grid cols={isPhone ? 1 : isDesktop ? 3 : 2} gap={16}>
        {captured.map((c) => (
          <MCard key={c.name} gap={12}>
            <Photo uri={c.img} height={130} contentFit="contain" round={8} style={{ backgroundColor: make.surface2, justifyContent: "flex-end", padding: 10 }}>
              <Tag green>{c.cat}</Tag>
            </Photo>
            <View>
              <MTxt variant="section" weight="600">
                {c.label}
              </MTxt>
              <MTxt muted>
                {c.conf}% {t.match}
              </MTxt>
            </View>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
              <Stepper value={c.qty} onDelta={(delta) => setQty(c.name, delta, lang)} />
              <MTxt muted style={{ marginLeft: "auto" }}>
                {c.unit}
              </MTxt>
            </View>
          </MCard>
        ))}
      </Grid>
  );
  return (
    <Page background={make.background} gap={16} scroll={!isWide}>
      <MakeHeader title={t.titles.review} />
      {isWide ? (
        <ScrollView style={{ flex: 1, minHeight: 0 }} contentContainerStyle={{ paddingBottom: 4 }} showsVerticalScrollIndicator>
          {grid}
        </ScrollView>
      ) : (
        grid
      )}
      <MCard background={make.surface2} padding={16} style={{ flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 14 }}>
        <MTxt muted style={{ marginRight: "auto" }}>
          {captured.length} {t.itemized} · {units} {t.units}
        </MTxt>
        <Button
          size="lg"
          label={t.addToStock}
          onPress={() => {
            addCapturedToStock(lang);
            nav.go("/make/stock");
          }}
        />
        <Button size="lg" variant="primary" accent={make.primary} label={t.seeWhatICanMake} onPress={() => nav.go("/make/canmake?mode=captured")} />
      </MCard>
    </Page>
  );
}
